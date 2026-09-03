"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Marca una comanda completa (todos sus items) como lista.
 * El detalle de "listo por item" vive en pedidos.actions.ts (actualizarEstadoItem);
 * esto es para cuando la estacion de cocina cierra la comanda entera.
 */
export async function marcarComandaLista(comandaId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("comandas")
    .update({ estado: "lista" })
    .eq("id", comandaId);

  if (error) return { ok: false as const, error: error.message };

  return { ok: true as const };
}
