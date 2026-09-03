"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Rol } from "@/lib/auth/roles";
import { MENU_CACHE_TAG } from "@/lib/pedidos/cargar-menu";
import { CONFIG_CACHE_TAG } from "@/lib/restaurante/config";

async function requireAdmin() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false as const, error: "No autenticado", supabase };

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", userData.user.id)
    .single();

  if (usuario?.rol !== "admin") {
    return { ok: false as const, error: "Solo admin", supabase };
  }

  return { ok: true as const, supabase, userId: userData.user.id };
}

async function requireAdminOrGerente() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false as const, error: "No autenticado", supabase };

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", userData.user.id)
    .single();

  if (!usuario || !["admin", "gerente"].includes(usuario.rol)) {
    return { ok: false as const, error: "Sin permiso", supabase };
  }

  return { ok: true as const, supabase, userId: userData.user.id };
}

const crearUsuarioSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(2),
  rol: z.enum(["admin", "gerente", "cajero", "mesero", "cocina", "contador"]),
});

export async function crearUsuario(input: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const parsed = crearUsuarioSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Datos invalidos" };

  const admin = createServiceRoleClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { nombre: parsed.data.nombre, rol: parsed.data.rol },
  });

  if (error || !data.user) {
    return { ok: false as const, error: error?.message ?? "No se pudo crear el usuario" };
  }

  // El trigger crea la fila; forzar rol/nombre por si el cast fallo o defaulto a mesero
  await admin.from("usuarios").upsert({
    id: data.user.id,
    nombre: parsed.data.nombre,
    rol: parsed.data.rol as Rol,
    activo: true,
  });

  revalidatePath("/admin/usuarios");
  return { ok: true as const, userId: data.user.id };
}

export async function actualizarUsuario(input: {
  id: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const { error } = await auth.supabase
    .from("usuarios")
    .update({
      nombre: input.nombre,
      rol: input.rol,
      activo: input.activo,
    })
    .eq("id", input.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}

const productoSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(2),
  precio_venta: z.number().nonnegative(),
  categoria_id: z.string().uuid().nullable().optional(),
  tipo: z.enum(["plato", "bebida", "combo"]).default("plato"),
  activo: z.boolean().default(true),
  descripcion: z.string().optional(),
});

export async function guardarProducto(input: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const parsed = productoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Datos invalidos" };

  const { id, ...rest } = parsed.data;

  if (id) {
    const { error } = await auth.supabase.from("productos").update(rest).eq("id", id);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await auth.supabase.from("productos").insert(rest);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin/menu");
  revalidatePath("/pedidos");
  revalidateTag(MENU_CACHE_TAG);
  return { ok: true as const };
}

export async function eliminarProducto(productoId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const { data: producto } = await auth.supabase
    .from("productos")
    .select("id, nombre")
    .eq("id", productoId)
    .single();

  if (!producto) return { ok: false as const, error: "Producto no encontrado" };

  const [{ count: pedidosCount }, { count: facturasCount }] = await Promise.all([
    auth.supabase
      .from("pedido_items")
      .select("id", { count: "exact", head: true })
      .eq("producto_id", productoId),
    auth.supabase
      .from("factura_items")
      .select("id", { count: "exact", head: true })
      .eq("producto_id", productoId),
  ]);

  if ((pedidosCount ?? 0) > 0 || (facturasCount ?? 0) > 0) {
    return {
      ok: false as const,
      error: `"${producto.nombre}" ya fue usado en pedidos o facturas. Desactivalo en lugar de eliminarlo.`,
    };
  }

  const { error } = await auth.supabase.from("productos").delete().eq("id", productoId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/menu");
  revalidatePath("/pedidos");
  revalidateTag(MENU_CACHE_TAG);
  return { ok: true as const };
}

export async function crearCategoria(nombre: string, orden = 0) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const { error } = await auth.supabase.from("categorias_menu").insert({ nombre, orden });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/menu");
  revalidateTag(MENU_CACHE_TAG);
  return { ok: true as const };
}

export async function eliminarCategoria(categoriaId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const { data: categoria } = await auth.supabase
    .from("categorias_menu")
    .select("id, nombre")
    .eq("id", categoriaId)
    .single();

  if (!categoria) return { ok: false as const, error: "Categoria no encontrada" };

  const { count: productosActivos } = await auth.supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("categoria_id", categoriaId)
    .eq("activo", true);

  if ((productosActivos ?? 0) > 0) {
    return {
      ok: false as const,
      error: `"${categoria.nombre}" tiene productos activos. Desactivalos o muevelos antes de eliminar la categoria.`,
    };
  }

  const { error } = await auth.supabase.from("categorias_menu").delete().eq("id", categoriaId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/menu");
  revalidatePath("/pedidos");
  revalidateTag(MENU_CACHE_TAG);
  return { ok: true as const };
}

export async function actualizarConfiguracion(input: {
  nombre_comercial: string;
  cedula_juridica?: string;
  telefono?: string;
  email_facturacion?: string;
  provincia?: string;
  canton?: string;
  distrito?: string;
  senas_exactas?: string;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const { data: config } = await auth.supabase.from("restaurante_config").select("id").limit(1).single();
  if (!config) return { ok: false as const, error: "No hay configuracion" };

  const { error } = await auth.supabase
    .from("restaurante_config")
    .update({
      nombre_comercial: input.nombre_comercial,
      cedula_juridica: input.cedula_juridica || null,
      telefono: input.telefono || null,
      email_facturacion: input.email_facturacion || null,
      provincia: input.provincia || null,
      canton: input.canton || null,
      distrito: input.distrito || null,
      senas_exactas: input.senas_exactas || null,
    })
    .eq("id", config.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/configuracion");
  revalidateTag(CONFIG_CACHE_TAG);
  return { ok: true as const };
}

export async function guardarInsumo(input: {
  id?: string;
  nombre: string;
  unidad_medida_id: string;
  stock_minimo: number;
  stock_actual?: number;
  costo_unitario_promedio?: number;
}) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false as const, error: "No autenticado" };

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", userData.user.id)
    .single();

  if (!usuario || !["admin", "gerente"].includes(usuario.rol)) {
    return { ok: false as const, error: "Sin permiso" };
  }

  if (input.id) {
    const { error } = await supabase
      .from("insumos")
      .update({
        nombre: input.nombre,
        unidad_medida_id: input.unidad_medida_id,
        stock_minimo: input.stock_minimo,
      })
      .eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await supabase.from("insumos").insert({
      nombre: input.nombre,
      unidad_medida_id: input.unidad_medida_id,
      stock_minimo: input.stock_minimo,
      stock_actual: input.stock_actual ?? 0,
      costo_unitario_promedio: input.costo_unitario_promedio ?? 0,
    });
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath("/inventario/insumos");
  return { ok: true as const };
}

export async function guardarReceta(input: {
  producto_id: string;
  insumo_id: string;
  cantidad_requerida: number;
  unidad_medida_id: string;
}) {
  const supabase = createClient();
  const { error } = await supabase.from("recetas").upsert(
    {
      producto_id: input.producto_id,
      insumo_id: input.insumo_id,
      cantidad_requerida: input.cantidad_requerida,
      unidad_medida_id: input.unidad_medida_id,
    },
    { onConflict: "producto_id,insumo_id" }
  );

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/inventario/recetas");
  return { ok: true as const };
}

export async function guardarMesa(input: {
  id?: string;
  numero: number;
  zona?: string;
  capacidad: number;
  estado?: "libre" | "ocupada" | "reservada" | "en_cuenta";
}) {
  const auth = await requireAdminOrGerente();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  if (input.id) {
    const { error } = await auth.supabase
      .from("mesas")
      .update({
        numero: input.numero,
        zona: input.zona || null,
        capacidad: input.capacidad,
        estado: input.estado ?? "libre",
      })
      .eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await auth.supabase.from("mesas").insert({
      numero: input.numero,
      zona: input.zona || null,
      capacidad: input.capacidad,
      estado: input.estado ?? "libre",
    });
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath("/pedidos");
  revalidatePath("/admin/mesas");
  return { ok: true as const };
}

export async function eliminarMesa(mesaId: string) {
  const auth = await requireAdminOrGerente();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const { data: mesa } = await auth.supabase
    .from("mesas")
    .select("id, estado, numero")
    .eq("id", mesaId)
    .single();

  if (!mesa) return { ok: false as const, error: "Mesa no encontrada" };

  if (mesa.estado !== "libre") {
    return {
      ok: false as const,
      error: `La mesa ${mesa.numero} esta ${mesa.estado}. Anula o cobra el pedido antes de eliminarla.`,
    };
  }

  const { data: pedidoActivo } = await auth.supabase
    .from("pedidos")
    .select("id")
    .eq("mesa_id", mesaId)
    .in("estado", ["abierto", "enviado", "en_preparacion", "servido"])
    .maybeSingle();

  if (pedidoActivo) {
    return {
      ok: false as const,
      error: "Hay un pedido activo en esa mesa. Anulalo primero.",
    };
  }

  // Desvincular pedidos historicos para poder borrar la mesa (mesa_id es nullable)
  await auth.supabase.from("pedidos").update({ mesa_id: null }).eq("mesa_id", mesaId);

  const { error } = await auth.supabase.from("mesas").delete().eq("id", mesaId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/pedidos");
  revalidatePath("/admin/mesas");
  return { ok: true as const };
}
