"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  marcarPlanillaSchema,
  upsertPlanillaSchema,
} from "@/lib/validators/planilla.schema";

function hoyCR(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function horaAhoraCR(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Costa_Rica",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

async function getSesion() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { ok: false as const, error: "No autenticado", supabase };
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, rol, activo")
    .eq("id", userData.user.id)
    .single();

  if (!usuario?.activo) {
    return { ok: false as const, error: "Usuario inactivo", supabase };
  }

  return {
    ok: true as const,
    supabase,
    userId: usuario.id,
    rol: usuario.rol as string,
  };
}

function puedeGestionarTodos(rol: string) {
  return ["admin", "gerente"].includes(rol);
}

export async function upsertPlanillaRegistro(input: unknown) {
  const sesion = await getSesion();
  if (!sesion.ok) return { ok: false as const, error: sesion.error };

  const parsed = upsertPlanillaSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { ok: false as const, error: msg };
  }

  const { id, usuarioId, fecha, horaEntrada, horaSalida, notas } = parsed.data;

  if (usuarioId !== sesion.userId && !puedeGestionarTodos(sesion.rol)) {
    return { ok: false as const, error: "Solo puedes registrar tu propia asistencia" };
  }

  const payload = {
    usuario_id: usuarioId,
    fecha,
    hora_entrada: horaEntrada || null,
    hora_salida: horaSalida || null,
    notas: notas?.trim() || null,
    registrado_por: sesion.userId,
  };

  if (id) {
    const { error } = await sesion.supabase
      .from("planilla_registros")
      .update(payload)
      .eq("id", id);

    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await sesion.supabase.from("planilla_registros").upsert(payload, {
      onConflict: "usuario_id,fecha",
    });

    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath("/planilla");
  return { ok: true as const };
}

export async function marcarMiPlanilla(input: unknown) {
  const sesion = await getSesion();
  if (!sesion.ok) return { ok: false as const, error: sesion.error };

  const parsed = marcarPlanillaSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Datos inválidos" };

  const fecha = parsed.data.fecha ?? hoyCR();
  const hora = horaAhoraCR();

  const { data: existente } = await sesion.supabase
    .from("planilla_registros")
    .select("id, hora_entrada, hora_salida")
    .eq("usuario_id", sesion.userId)
    .eq("fecha", fecha)
    .maybeSingle();

  if (parsed.data.tipo === "entrada") {
    if (existente?.hora_entrada) {
      return { ok: false as const, error: "Ya registraste la entrada de hoy" };
    }
    const { error } = await sesion.supabase.from("planilla_registros").upsert(
      {
        usuario_id: sesion.userId,
        fecha,
        hora_entrada: hora,
        hora_salida: existente?.hora_salida ?? null,
        registrado_por: sesion.userId,
      },
      { onConflict: "usuario_id,fecha" }
    );
    if (error) return { ok: false as const, error: error.message };
  } else {
    if (!existente?.hora_entrada) {
      return { ok: false as const, error: "Primero marca la entrada" };
    }
    if (existente.hora_salida) {
      return { ok: false as const, error: "Ya registraste la salida de hoy" };
    }
    if (hora < String(existente.hora_entrada).slice(0, 5)) {
      return { ok: false as const, error: "La salida no puede ser antes que la entrada" };
    }
    const { error } = await sesion.supabase
      .from("planilla_registros")
      .update({
        hora_salida: hora,
        registrado_por: sesion.userId,
      })
      .eq("id", existente.id);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath("/planilla");
  return { ok: true as const, hora };
}

export async function eliminarPlanillaRegistro(id: string) {
  const sesion = await getSesion();
  if (!sesion.ok) return { ok: false as const, error: sesion.error };

  if (!puedeGestionarTodos(sesion.rol)) {
    return { ok: false as const, error: "Sin permiso para eliminar" };
  }

  const { error } = await sesion.supabase.from("planilla_registros").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/planilla");
  return { ok: true as const };
}

export async function actualizarTarifaHora(usuarioId: string, tarifaHora: number | null) {
  const sesion = await getSesion();
  if (!sesion.ok) return { ok: false as const, error: sesion.error };

  if (!puedeGestionarTodos(sesion.rol)) {
    return { ok: false as const, error: "Solo admin o gerente puede definir tarifas" };
  }

  if (tarifaHora != null && (Number.isNaN(tarifaHora) || tarifaHora < 0)) {
    return { ok: false as const, error: "Tarifa inválida" };
  }

  const { error } = await sesion.supabase
    .from("usuarios")
    .update({ tarifa_hora: tarifaHora })
    .eq("id", usuarioId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/planilla");
  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}
