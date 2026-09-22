import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual, puedeVerReportesContador } from "@/lib/auth/usuario";
import { csvResponseBody, recordsToCsv } from "@/lib/csv";
import {
  labelMesAnio,
  parseReporteContadorAnual,
  parseReporteContadorMensual,
} from "@/lib/contabilidad/reportes-contador";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") ?? "mensual";

  const usuario = await getUsuarioActual();
  if (!usuario || !puedeVerReportesContador(usuario.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = createClient();

  if (tipo === "mensual") {
    const anio = Number(searchParams.get("anio"));
    const mes = Number(searchParams.get("mes"));
    if (!Number.isFinite(anio) || !Number.isFinite(mes) || mes < 1 || mes > 12) {
      return NextResponse.json({ error: "Parámetros anio y mes requeridos" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("reporte_contador_mensual", {
      p_anio: anio,
      p_mes: mes,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const r = parseReporteContadorMensual(data);
    if (!r) {
      return NextResponse.json({ error: "Respuesta inválida" }, { status: 500 });
    }

    const rows: Record<string, unknown>[] = [
      { seccion: "VENTAS", concepto: "Total vendido", monto: r.ventas.total_vendido },
      { seccion: "VENTAS", concepto: "IVA cobrado", monto: r.ventas.iva_cobrado },
      { seccion: "COMPRAS", concepto: "Total comprado", monto: r.compras.total_comprado },
      { seccion: "COMPRAS", concepto: "IVA pagado 13%", monto: r.compras.iva_compras_13 },
      { seccion: "COMPRAS", concepto: "IVA pagado 1%", monto: r.compras.iva_compras_1 },
      { seccion: "RESULTADO", concepto: "IVA cobrado", monto: r.resultado.iva_cobrado },
      { seccion: "RESULTADO", concepto: "IVA pagado", monto: r.resultado.iva_pagado },
      { seccion: "RESULTADO", concepto: "Diferencia aprox Hacienda", monto: r.resultado.diferencia_iva },
      {
        seccion: "META",
        concepto: "Periodo",
        monto: labelMesAnio(anio, mes),
      },
    ];

    const csv = csvResponseBody(recordsToCsv(rows));
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="contador-mensual-${anio}-${String(mes).padStart(2, "0")}.csv"`,
      },
    });
  }

  if (tipo === "anual") {
    const anio = Number(searchParams.get("anio"));
    if (!Number.isFinite(anio)) {
      return NextResponse.json({ error: "Parámetro anio requerido" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("reporte_contador_anual", { p_anio: anio });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const r = parseReporteContadorAnual(data);
    if (!r) {
      return NextResponse.json({ error: "Respuesta inválida" }, { status: 500 });
    }

    const rows: Record<string, unknown>[] = [
      { concepto: "Total ventas", monto: r.ventas_total },
      { concepto: "Total compras mercadería", monto: r.compras_mercaderia },
      { concepto: "Total gastos operativos", monto: r.gastos_operativos },
      { concepto: "Salarios estimados planilla", monto: r.salarios_estimados },
      { concepto: "Ganancia aproximada", monto: r.ganancia_aproximada },
      { concepto: "Año", monto: anio },
    ];

    const csv = csvResponseBody(recordsToCsv(rows));
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="contador-anual-${anio}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "tipo debe ser mensual o anual" }, { status: 400 });
}
