"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function abrirTurnoCaja(montoApertura: number) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false as const, error: "No autenticado" };

  const { data, error } = await supabase
    .from("turnos_caja")
    .insert({
      cajero_id: userData.user.id,
      monto_apertura: montoApertura,
      estado: "abierto",
    })
    .select()
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/contabilidad/cierres");
  return { ok: true as const, turnoId: data.id };
}

export async function cerrarTurnoCaja(input: { turnoId: string; montoContado: number }) {
  const supabase = createClient();

  // `monto_esperado` se calcula en la base de datos (suma de pagos del turno)
  // mediante la funcion Postgres `calcular_monto_esperado_turno`.
  const { data: esperado, error: errorCalculo } = await supabase.rpc(
    "calcular_monto_esperado_turno",
    { p_turno_id: input.turnoId }
  );

  if (errorCalculo) return { ok: false as const, error: errorCalculo.message };

  const diferencia = input.montoContado - (esperado ?? 0);

  const { error } = await supabase
    .from("turnos_caja")
    .update({
      monto_esperado: esperado,
      monto_contado: input.montoContado,
      diferencia,
      estado: "cerrado",
      cerrado_en: new Date().toISOString(),
    })
    .eq("id", input.turnoId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/contabilidad/cierres");
  return { ok: true as const, diferencia };
}

export async function generarCierreDiario(fecha: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("generar_cierre_diario", { p_fecha: fecha });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/contabilidad/cierres");
  revalidatePath("/contabilidad/reportes");
  return { ok: true as const, cierre: data };
}
