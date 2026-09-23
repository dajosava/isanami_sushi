"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  calcularMontosCompra,
  esCategoriaGasto,
  esTasaIvaCompra,
} from "@/lib/compras/categorias";
import { LIMITES } from "@/lib/limites-campos";

type SupabaseServer = ReturnType<typeof createClient>;

async function resolverProveedorId(supabase: SupabaseServer, nombreRaw: string) {
  const nombre = nombreRaw.trim();
  if (!nombre) return { ok: false as const, error: "Indica el nombre del proveedor" };
  if (nombre.length > LIMITES.proveedorNombre) {
    return {
      ok: false as const,
      error: `El proveedor no puede superar ${LIMITES.proveedorNombre} caracteres`,
    };
  }

  const { data: existentes, error } = await supabase
    .from("proveedores")
    .select("id, nombre")
    .ilike("nombre", nombre)
    .limit(20);

  if (error) return { ok: false as const, error: error.message };

  const exacto = (existentes ?? []).find(
    (p) => p.nombre.trim().toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es")
  );
  if (exacto) return { ok: true as const, id: exacto.id as string };

  const { data: creado, error: errorCrear } = await supabase
    .from("proveedores")
    .insert({ nombre })
    .select("id")
    .single();

  if (errorCrear || !creado) {
    return {
      ok: false as const,
      error: errorCrear?.message ?? "No se pudo registrar el proveedor",
    };
  }

  return { ok: true as const, id: creado.id as string };
}

async function resolverInsumoId(
  supabase: SupabaseServer,
  nombreRaw: string,
  unidadMedidaId?: string
) {
  const nombre = nombreRaw.trim();
  if (!nombre) return { ok: false as const, error: "Indica el nombre del insumo" };
  if (nombre.length > LIMITES.insumoNombre) {
    return {
      ok: false as const,
      error: `El insumo no puede superar ${LIMITES.insumoNombre} caracteres`,
    };
  }

  const { data: existentes, error } = await supabase
    .from("insumos")
    .select("id, nombre")
    .ilike("nombre", nombre)
    .limit(20);

  if (error) return { ok: false as const, error: error.message };

  const exacto = (existentes ?? []).find(
    (i) => i.nombre.trim().toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es")
  );
  if (exacto) return { ok: true as const, id: exacto.id as string, creado: false };

  let unidadId = unidadMedidaId?.trim() || "";
  if (!unidadId) {
    const { data: unidadDefault } = await supabase
      .from("unidades_medida")
      .select("id")
      .eq("abreviatura", "u")
      .maybeSingle();
    unidadId = unidadDefault?.id ?? "";
  }

  if (!unidadId) {
    return { ok: false as const, error: "Selecciona la unidad del insumo nuevo" };
  }

  const { data: creado, error: errorCrear } = await supabase
    .from("insumos")
    .insert({
      nombre,
      unidad_medida_id: unidadId,
      stock_actual: 0,
      stock_minimo: 0,
      costo_unitario_promedio: 0,
    })
    .select("id")
    .single();

  if (errorCrear || !creado) {
    return {
      ok: false as const,
      error: errorCrear?.message ?? "No se pudo registrar el insumo",
    };
  }

  return { ok: true as const, id: creado.id as string, creado: true };
}

export async function registrarCompra(input: {
  proveedorNombre: string;
  numeroFacturaProveedor?: string;
  fecha: string; // YYYY-MM-DD
  categoriaGasto: string;
  impuestoIvaPct: number;
  /** Subtotal manual (obligatorio si no es mercadería) */
  subtotal?: number;
  concepto?: string;
  items?: {
    insumoNombre: string;
    unidadMedidaId: string;
    cantidad: number;
    costoUnitario: number;
  }[];
}) {
  const supabase = createClient();

  if (!esCategoriaGasto(input.categoriaGasto)) {
    return { ok: false as const, error: "Categoría de gasto no válida" };
  }
  if (!esTasaIvaCompra(Number(input.impuestoIvaPct))) {
    return { ok: false as const, error: "Tasa de IVA no válida (0, 1 o 13)" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha)) {
    return { ok: false as const, error: "Fecha no válida" };
  }

  const proveedor = await resolverProveedorId(supabase, input.proveedorNombre);
  if (!proveedor.ok) return proveedor;

  const esMercaderia = input.categoriaGasto === "mercaderia";
  const concepto = input.concepto?.trim() || null;

  if (concepto && concepto.length > LIMITES.compraConcepto) {
    return {
      ok: false as const,
      error: `El concepto no puede superar ${LIMITES.compraConcepto} caracteres`,
    };
  }

  const itemsResueltos: {
    insumoId: string;
    unidadMedidaId: string;
    cantidad: number;
    costoUnitario: number;
  }[] = [];

  let subtotalBase = 0;

  if (esMercaderia) {
    if (!input.items?.length) {
      return { ok: false as const, error: "Agrega al menos un insumo" };
    }

    for (const it of input.items) {
      if (!(it.cantidad > 0)) {
        return { ok: false as const, error: "La cantidad debe ser mayor a cero" };
      }
      if (!(it.costoUnitario >= 0)) {
        return { ok: false as const, error: "El costo unitario no es válido" };
      }
      const unidadMedidaId = it.unidadMedidaId?.trim() ?? "";
      if (!unidadMedidaId) {
        return {
          ok: false as const,
          error: "Selecciona la unidad de medida (kg, g, l, paquete…)",
        };
      }

      const insumo = await resolverInsumoId(supabase, it.insumoNombre, unidadMedidaId);
      if (!insumo.ok) return insumo;

      itemsResueltos.push({
        insumoId: insumo.id,
        unidadMedidaId,
        cantidad: it.cantidad,
        costoUnitario: it.costoUnitario,
      });
    }

    subtotalBase = itemsResueltos.reduce(
      (acc, it) => acc + it.cantidad * it.costoUnitario,
      0
    );
  } else {
    if (!concepto) {
      return { ok: false as const, error: "Indica el concepto del gasto" };
    }
    const s = Number(input.subtotal);
    if (!Number.isFinite(s) || s < 0) {
      return { ok: false as const, error: "El subtotal no es válido" };
    }
    if (s === 0) {
      return { ok: false as const, error: "El subtotal debe ser mayor a cero" };
    }
    subtotalBase = s;
  }

  const montos = calcularMontosCompra(subtotalBase, Number(input.impuestoIvaPct));
  const fechaIso = new Date(`${input.fecha}T12:00:00-06:00`).toISOString();

  const { data: compra, error: errorCompra } = await supabase
    .from("compras")
    .insert({
      proveedor_id: proveedor.id,
      numero_factura_proveedor: input.numeroFacturaProveedor?.trim() || null,
      fecha: fechaIso,
      subtotal: montos.subtotal,
      total_impuesto: montos.totalImpuesto,
      impuesto_iva_pct: Number(input.impuestoIvaPct),
      total: montos.total,
      categoria_gasto: input.categoriaGasto,
      concepto,
      estado: "recibida",
    })
    .select()
    .single();

  if (errorCompra || !compra) {
    return { ok: false as const, error: errorCompra?.message ?? "No se pudo registrar la compra" };
  }

  if (itemsResueltos.length > 0) {
    const { error: errorItems } = await supabase.from("compras_items").insert(
      itemsResueltos.map((it) => ({
        compra_id: compra.id,
        insumo_id: it.insumoId,
        unidad_medida_id: it.unidadMedidaId,
        cantidad: it.cantidad,
        costo_unitario: it.costoUnitario,
      }))
    );

    if (errorItems) return { ok: false as const, error: errorItems.message };
  }

  revalidatePath("/inventario/compras");
  revalidatePath("/inventario/insumos");
  return { ok: true as const, compraId: compra.id };
}

export async function registrarMerma(input: { insumoId: string; cantidad: number; motivo: string }) {
  const supabase = createClient();

  const { error } = await supabase.rpc("registrar_merma", {
    p_insumo_id: input.insumoId,
    p_cantidad: Math.abs(input.cantidad),
    p_motivo: input.motivo,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/inventario/insumos");
  revalidatePath("/inventario/compras");
  return { ok: true as const };
}

export async function actualizarStockMinimo(input: { insumoId: string; stockMinimo: number }) {
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

  if (!Number.isFinite(input.stockMinimo) || input.stockMinimo < 0) {
    return { ok: false as const, error: "El stock mínimo no es válido" };
  }

  const { error } = await supabase
    .from("insumos")
    .update({ stock_minimo: input.stockMinimo })
    .eq("id", input.insumoId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/inventario/insumos");
  return { ok: true as const };
}

export async function eliminarInsumo(insumoId: string) {
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

  const { data: insumo } = await supabase
    .from("insumos")
    .select("id, nombre")
    .eq("id", insumoId)
    .single();

  if (!insumo) return { ok: false as const, error: "Insumo no encontrado" };

  const [{ count: recetasCount }, { count: comprasCount }] = await Promise.all([
    supabase
      .from("recetas")
      .select("id", { count: "exact", head: true })
      .eq("insumo_id", insumoId),
    supabase
      .from("compras_items")
      .select("id", { count: "exact", head: true })
      .eq("insumo_id", insumoId),
  ]);

  if ((recetasCount ?? 0) > 0) {
    return {
      ok: false as const,
      error: `"${insumo.nombre}" está en recetas. Quítalo de las recetas antes de eliminarlo.`,
    };
  }

  if ((comprasCount ?? 0) > 0) {
    return {
      ok: false as const,
      error: `"${insumo.nombre}" ya aparece en compras. No se puede eliminar para conservar el historial.`,
    };
  }

  // Movimientos (mermas/ajustes) no bloquean: se borran con el insumo
  const { error: errorMov } = await supabase
    .from("movimientos_inventario")
    .delete()
    .eq("insumo_id", insumoId);

  if (errorMov) return { ok: false as const, error: errorMov.message };

  const { error } = await supabase.from("insumos").delete().eq("id", insumoId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/inventario/insumos");
  revalidatePath("/inventario/recetas");
  revalidatePath("/inventario/compras");
  return { ok: true as const };
}
