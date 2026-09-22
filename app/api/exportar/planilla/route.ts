import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth/usuario";
import type { Rol } from "@/lib/auth/roles";
import { csvResponseBody, recordsToCsv } from "@/lib/csv";
import {
  calcularResumenPago,
  type ColaboradorResumenInput,
} from "@/lib/planilla/resumen";
import { formatearHorasDecimal, minutosTrabajados } from "@/lib/planilla/horas";

const ROLES_EXPORTAR: Rol[] = ["admin", "gerente", "contador"];

function puedeExportarPlanilla(rol: Rol) {
  return ROLES_EXPORTAR.includes(rol);
}

function normalizarHora(valor: string | null | undefined) {
  if (!valor) return "";
  return String(valor).slice(0, 5);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const tipo = searchParams.get("tipo") ?? "resumen";

  if (!desde || !hasta || !/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
    return NextResponse.json(
      { error: "Parámetros 'desde' y 'hasta' requeridos (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  if (tipo !== "resumen" && tipo !== "detalle") {
    return NextResponse.json({ error: "tipo debe ser 'resumen' o 'detalle'" }, { status: 400 });
  }

  const usuario = await getUsuarioActual();
  if (!usuario || !puedeExportarPlanilla(usuario.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = createClient();

  const [{ data: activos }, { data: registros, error: errReg }] = await Promise.all([
    supabase.from("usuarios").select("id, nombre, rol, activo").eq("activo", true).order("nombre"),
    supabase
      .from("planilla_registros")
      .select("id, usuario_id, fecha, hora_entrada, hora_salida, notas")
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha")
      .order("hora_entrada"),
  ]);

  if (errReg) {
    return NextResponse.json({ error: errReg.message }, { status: 500 });
  }

  const idsEnRegistros = Array.from(new Set((registros ?? []).map((r) => r.usuario_id)));
  const idsActivos = new Set((activos ?? []).map((u) => u.id));
  const faltantes = idsEnRegistros.filter((id) => !idsActivos.has(id));

  let extras: { id: string; nombre: string; rol: string }[] = [];
  if (faltantes.length > 0) {
    const { data } = await supabase
      .from("usuarios")
      .select("id, nombre, rol")
      .in("id", faltantes);
    extras = data ?? [];
  }

  const baseColab: ColaboradorResumenInput[] = [
    ...(activos ?? []).map((u) => ({
      id: u.id,
      nombre: u.nombre,
      rol: u.rol,
      tarifaHora: null as number | null,
    })),
    ...extras.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      rol: u.rol,
      tarifaHora: null as number | null,
    })),
  ];

  const ids = baseColab.map((c) => c.id);
  if (ids.length > 0) {
    const { data: tarifas } = await supabase.from("usuarios").select("id, tarifa_hora").in("id", ids);
    const map = new Map((tarifas ?? []).map((t) => [t.id, t.tarifa_hora != null ? Number(t.tarifa_hora) : null]));
    for (const c of baseColab) {
      c.tarifaHora = map.get(c.id) ?? null;
    }
  }

  const nombres = new Map(baseColab.map((c) => [c.id, c.nombre]));

  let filename: string;
  let rows: Record<string, unknown>[];

  if (tipo === "resumen") {
    const resumen = calcularResumenPago(
      baseColab,
      (registros ?? []).map((r) => ({
        usuarioId: r.usuario_id,
        nombre: nombres.get(r.usuario_id) ?? "Colaborador",
        horaEntrada: r.hora_entrada,
        horaSalida: r.hora_salida,
      })),
      { incluirTodosColaboradores: true }
    );

    rows = resumen.map((r) => ({
      colaborador: r.nombre,
      rol: r.rol,
      horas_decimal: r.horas.toFixed(2),
      dias_completos: r.diasCompletos,
      dias_pendientes: r.diasPendientes,
      tarifa_hora_crc: r.tarifa ?? "",
      pago_estimado_crc: r.pago ?? "",
      periodo_desde: desde,
      periodo_hasta: hasta,
    }));
    filename = `planilla-resumen-${desde}-${hasta}.csv`;
  } else {
    rows = (registros ?? []).map((r) => {
      const mins = minutosTrabajados(r.hora_entrada, r.hora_salida);
      return {
        colaborador: nombres.get(r.usuario_id) ?? "Colaborador",
        fecha: r.fecha,
        hora_entrada: normalizarHora(r.hora_entrada),
        hora_salida: normalizarHora(r.hora_salida),
        horas_decimal: mins != null ? formatearHorasDecimal(mins) : "",
        notas: r.notas ?? "",
      };
    });
    filename = `planilla-detalle-${desde}-${hasta}.csv`;
  }

  const csv = csvResponseBody(recordsToCsv(rows));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
