"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface CrearComprobanteInput {
  pedidoId: string;
  clienteId?: string;
  medioPago: "efectivo" | "tarjeta" | "sinpe" | "mixto";
  montoRecibido: number;
}

/**
 * Crea el comprobante interno de cobro (NO es factura electronica fiscal).
 */
export async function crearComprobante(input: CrearComprobanteInput) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("crear_comprobante_venta", {
    p_pedido_id: input.pedidoId,
    p_cliente_id: input.clienteId ?? null,
    p_medio_pago: input.medioPago,
    p_monto_recibido: input.montoRecibido,
  });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/facturacion");
  revalidatePath("/pedidos");
  return { ok: true as const, comprobante: data };
}

export async function anularComprobante(facturaId: string, motivo: string) {
  if (!motivo.trim()) return { ok: false as const, error: "El motivo es obligatorio" };

  const supabase = createClient();
  const { error } = await supabase.rpc("anular_comprobante_venta", {
    p_factura_id: facturaId,
    p_motivo: motivo.trim(),
  });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/facturacion");
  revalidatePath(`/facturacion/${facturaId}`);
  return { ok: true as const };
}
