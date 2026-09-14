"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type MedioPago = "efectivo" | "tarjeta" | "sinpe" | "mixto";

interface CrearComprobanteInput {
  pedidoId: string;
  clienteId?: string;
  medioPago: MedioPago;
  montoRecibido: number;
}

export interface PagoDivididoInput {
  metodo: MedioPago;
  monto: number;
  etiqueta?: string;
}

/**
 * Crea el comprobante interno de cobro (NO es factura electronica fiscal).
 */
export async function crearComprobante(input: CrearComprobanteInput) {
  try {
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
    revalidatePath("/cocina");
    return { ok: true as const, comprobanteId: (data as { id?: string } | null)?.id ?? null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al crear el comprobante";
    return { ok: false as const, error: message };
  }
}

/** Cobro con uno o varios pagos (cuenta dividida). */
export async function crearComprobanteConPagos(input: {
  pedidoId: string;
  clienteId?: string;
  pagos: PagoDivididoInput[];
}) {
  try {
    if (!input.pagos?.length) {
      return { ok: false as const, error: "Agrega al menos un pago" };
    }

    for (const p of input.pagos) {
      if (!p.metodo || !(p.monto > 0)) {
        return { ok: false as const, error: "Cada persona debe tener medio y monto válido" };
      }
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc("crear_comprobante_venta_pagos", {
      p_pedido_id: input.pedidoId,
      p_cliente_id: input.clienteId ?? null,
      p_pagos: input.pagos.map((p) => ({
        metodo: p.metodo,
        monto: Number(p.monto),
        etiqueta: p.etiqueta?.slice(0, 200) ?? null,
      })),
    });

    if (error) return { ok: false as const, error: error.message };

    revalidatePath("/facturacion");
    revalidatePath("/pedidos");
    revalidatePath("/cocina");
    return { ok: true as const, comprobanteId: (data as { id?: string } | null)?.id ?? null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al crear el comprobante dividido";
    return { ok: false as const, error: message };
  }
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
