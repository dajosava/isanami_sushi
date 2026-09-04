"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  crearPedidoSchema,
  agregarItemsAPedidoSchema,
  actualizarEstadoItemSchema,
} from "@/lib/validators/pedido.schema";

function revalidateRutasPedido(pedido: {
  id: string;
  mesa_id: string | null;
  tipo?: string;
}) {
  revalidatePath("/pedidos");
  if (pedido.mesa_id) {
    revalidatePath(`/pedidos/${pedido.mesa_id}`);
  }
  if (pedido.tipo === "para_llevar" || (!pedido.mesa_id && pedido.tipo !== "salon")) {
    revalidatePath(`/pedidos/para-llevar/${pedido.id}`);
    revalidatePath("/pedidos/para-llevar/nuevo");
  }
}

export async function crearPedido(input: unknown) {
  const parsed = crearPedidoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() };
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false as const, error: "No autenticado" };

  const { mesaId, tipo, items, notas, nombreCliente } = parsed.data;
  const mesaIdFinal = tipo === "salon" ? mesaId : null;
  const nombreFinal =
    tipo === "para_llevar" || tipo === "delivery"
      ? (nombreCliente?.trim().replace(/\s+/g, " ") || null)
      : null;

  const { data: pedido, error: errorPedido } = await supabase
    .from("pedidos")
    .insert({
      mesa_id: mesaIdFinal,
      mesero_id: userData.user.id,
      tipo,
      estado: "abierto",
      notas: notas ?? null,
      nombre_cliente: nombreFinal,
    })
    .select()
    .single();

  if (errorPedido || !pedido) {
    return { ok: false as const, error: errorPedido?.message ?? "No se pudo crear el pedido" };
  }

  const { error: errorItems } = await supabase.from("pedido_items").insert(
    items.map((item) => ({
      pedido_id: pedido.id,
      producto_id: item.productoId,
      cantidad: item.cantidad,
      notas: item.notas ?? null,
      estado_cocina: "pendiente",
    }))
  );

  if (errorItems) {
    return { ok: false as const, error: errorItems.message };
  }

  if (mesaIdFinal) {
    await supabase.from("mesas").update({ estado: "ocupada" }).eq("id", mesaIdFinal);
  }

  revalidatePath("/pedidos");
  if (mesaIdFinal) revalidatePath(`/pedidos/${mesaIdFinal}`);
  if (tipo === "para_llevar") {
    revalidatePath("/pedidos/para-llevar/nuevo");
    revalidatePath(`/pedidos/para-llevar/${pedido.id}`);
  }
  return { ok: true as const, pedidoId: pedido.id };
}

export async function agregarItemsAPedido(input: unknown) {
  const parsed = agregarItemsAPedidoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() };
  }

  const supabase = createClient();
  const { pedidoId, items } = parsed.data;

  const { data: pedido, error: errorPedido } = await supabase
    .from("pedidos")
    .select("id, mesa_id, tipo, estado")
    .eq("id", pedidoId)
    .single();

  if (errorPedido || !pedido) {
    return { ok: false as const, error: errorPedido?.message ?? "Pedido no encontrado" };
  }

  if (["cerrado", "anulado"].includes(pedido.estado)) {
    return { ok: false as const, error: "El pedido ya esta cerrado" };
  }

  const rows = items.map((item) => ({
    pedido_id: pedidoId,
    producto_id: item.productoId,
    cantidad: item.cantidad,
    notas: item.notas ?? null,
    estado_cocina: "pendiente" as const,
  }));

  const { data: inserted, error: errorItems } = await supabase
    .from("pedido_items")
    .insert(rows)
    .select("id");

  if (errorItems || !inserted) {
    return { ok: false as const, error: errorItems?.message ?? "No se pudieron agregar los items" };
  }

  // Si el pedido ya fue enviado a cocina, generar comandas solo para los items nuevos
  if (["enviado", "en_preparacion", "servido"].includes(pedido.estado)) {
    const { error: errorComandas } = await supabase.rpc("generar_comandas_para_items", {
      p_pedido_id: pedidoId,
      p_item_ids: inserted.map((row) => row.id),
    });
    if (errorComandas) {
      return { ok: false as const, error: errorComandas.message };
    }
  }

  revalidatePath("/cocina");
  revalidateRutasPedido(pedido);
  return { ok: true as const, itemIds: inserted.map((row) => row.id) };
}

export async function enviarPedidoACocina(pedidoId: string) {
  const supabase = createClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, estado, mesa_id, tipo")
    .eq("id", pedidoId)
    .single();

  if (!pedido) return { ok: false as const, error: "Pedido no encontrado" };

  // Si ya esta enviado, generar comandas solo para items pendientes sin comanda
  if (pedido.estado !== "abierto") {
    const { data: items } = await supabase
      .from("pedido_items")
      .select("id, estado_cocina")
      .eq("pedido_id", pedidoId)
      .eq("estado_cocina", "pendiente");

    if (items && items.length > 0) {
      const { error: errorComandas } = await supabase.rpc("generar_comandas_para_items", {
        p_pedido_id: pedidoId,
        p_item_ids: items.map((i) => i.id),
      });
      if (errorComandas) return { ok: false as const, error: errorComandas.message };
    }
  } else {
    const { error } = await supabase.from("pedidos").update({ estado: "enviado" }).eq("id", pedidoId);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath("/cocina");
  revalidateRutasPedido(pedido);
  return { ok: true as const };
}

export async function actualizarEstadoItem(input: unknown) {
  const parsed = actualizarEstadoItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten() };

  const supabase = createClient();
  const { error } = await supabase
    .from("pedido_items")
    .update({ estado_cocina: parsed.data.estado })
    .eq("id", parsed.data.pedidoItemId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/cocina");
  revalidatePath("/pedidos");
  return { ok: true as const };
}

export async function cerrarPedido(pedidoId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("pedidos")
    .update({ estado: "cerrado", cerrado_en: new Date().toISOString() })
    .eq("id", pedidoId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/pedidos");
  return { ok: true as const };
}

/**
 * Anula (deshace) el pedido activo de una mesa:
 * - pedido → anulado
 * - comandas pendientes salen del KDS
 * - mesa → libre
 */
export async function anularPedido(pedidoId: string) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false as const, error: "No autenticado" };

  const { data: pedido, error: errorPedido } = await supabase
    .from("pedidos")
    .select("id, mesa_id, tipo, estado")
    .eq("id", pedidoId)
    .single();

  if (errorPedido || !pedido) {
    return { ok: false as const, error: errorPedido?.message ?? "Pedido no encontrado" };
  }

  if (["cerrado", "anulado"].includes(pedido.estado)) {
    return { ok: false as const, error: "El pedido ya no se puede anular" };
  }

  const { error } = await supabase
    .from("pedidos")
    .update({ estado: "anulado", cerrado_en: new Date().toISOString() })
    .eq("id", pedidoId);

  if (error) return { ok: false as const, error: error.message };

  // Sacar comandas del KDS
  await supabase
    .from("comandas")
    .update({ estado: "anulada" })
    .eq("pedido_id", pedidoId)
    .neq("estado", "lista");

  if (pedido.mesa_id) {
    await supabase.from("mesas").update({ estado: "libre" }).eq("id", pedido.mesa_id);
  }

  revalidatePath("/cocina");
  revalidateRutasPedido(pedido);
  return { ok: true as const };
}

/**
 * Quita un item del pedido (pendiente o en preparacion) y lo saca de comandas.
 */
export async function eliminarItemPedido(pedidoItemId: string) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("eliminar_pedido_item", {
    p_item_id: pedidoItemId,
  });

  // Fallback si la migracion 0020 aun no esta aplicada
  if (error && (error.message.includes("eliminar_pedido_item") || error.code === "PGRST202")) {
    const { data: item, error: errorItem } = await supabase
      .from("pedido_items")
      .select("id, pedido_id, estado_cocina, pedidos(id, mesa_id, tipo, estado)")
      .eq("id", pedidoItemId)
      .single();

    if (errorItem || !item) {
      return { ok: false as const, error: errorItem?.message ?? "Item no encontrado" };
    }

    if (!["pendiente", "en_preparacion"].includes(item.estado_cocina)) {
      return {
        ok: false as const,
        error: "Solo se pueden quitar items pendientes o en preparacion",
      };
    }

    const pedido = Array.isArray(item.pedidos) ? item.pedidos[0] : item.pedidos;
    if (!pedido || ["cerrado", "anulado"].includes(pedido.estado)) {
      return { ok: false as const, error: "El pedido ya no admite cambios" };
    }

    const { data: deleted, error: errorDelete } = await supabase
      .from("pedido_items")
      .delete()
      .eq("id", pedidoItemId)
      .select("id");

    if (errorDelete) return { ok: false as const, error: errorDelete.message };
    if (!deleted?.length) {
      return {
        ok: false as const,
        error:
          "No se pudo eliminar el item. Aplica la migracion 0020_eliminar_pedido_item.sql en Supabase.",
      };
    }

    const { data: restantes } = await supabase
      .from("pedido_items")
      .select("id")
      .eq("pedido_id", item.pedido_id);

    if (!restantes || restantes.length === 0) {
      await anularPedido(item.pedido_id);
    } else {
      revalidatePath("/cocina");
      revalidateRutasPedido(pedido);
    }

    return { ok: true as const };
  }

  if (error) return { ok: false as const, error: error.message };

  const result = (data ?? {}) as {
    pedido_id?: string;
    restantes?: number;
    mesa_id?: string | null;
    tipo?: string;
  };

  if ((result.restantes ?? 0) === 0 && result.pedido_id) {
    await anularPedido(result.pedido_id);
  } else if (result.pedido_id) {
    revalidatePath("/cocina");
    revalidateRutasPedido({
      id: result.pedido_id,
      mesa_id: result.mesa_id ?? null,
      tipo: result.tipo ?? "salon",
    });
  }

  return { ok: true as const };
}
