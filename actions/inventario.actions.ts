"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registrarCompra(input: {
  proveedorId: string;
  numeroFacturaProveedor?: string;
  items: { insumoId: string; cantidad: number; costoUnitario: number }[];
}) {
  const supabase = createClient();

  const total = input.items.reduce((acc, it) => acc + it.cantidad * it.costoUnitario, 0);

  const { data: compra, error: errorCompra } = await supabase
    .from("compras")
    .insert({
      proveedor_id: input.proveedorId,
      numero_factura_proveedor: input.numeroFacturaProveedor ?? null,
      fecha: new Date().toISOString(),
      total,
      estado: "recibida",
    })
    .select()
    .single();

  if (errorCompra || !compra) {
    return { ok: false as const, error: errorCompra?.message ?? "No se pudo registrar la compra" };
  }

  const { error: errorItems } = await supabase.from("compras_items").insert(
    input.items.map((it) => ({
      compra_id: compra.id,
      insumo_id: it.insumoId,
      cantidad: it.cantidad,
      costo_unitario: it.costoUnitario,
    }))
  );

  if (errorItems) return { ok: false as const, error: errorItems.message };

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
