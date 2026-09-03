import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { filtrosAnaliticaSchema } from "@/app/(dashboard)/analitica/lib/types";
import { rangoDesdePreset, canalRpc } from "@/app/(dashboard)/analitica/lib/fechas";
import { getUsuarioActual, puedeVerAnalitica } from "@/lib/auth/usuario";

function toCsv(rows: Record<string, unknown>[]): string {
  const first = rows[0];
  if (!first) return "";
  const headers = Object.keys(first);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") ?? "libro_ventas";
  const preset = searchParams.get("preset") ?? "30d";
  const desdeParam = searchParams.get("desde");
  const hastaParam = searchParams.get("hasta");
  const canal = searchParams.get("canal");

  const rango =
    desdeParam && hastaParam
      ? { desde: desdeParam, hasta: hastaParam }
      : rangoDesdePreset(preset as never);

  const parsed = filtrosAnaliticaSchema.safeParse({
    preset,
    desde: rango.desde,
    hasta: rango.hasta,
    canal: canal || null,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros invalidos" }, { status: 400 });
  }

  const usuario = await getUsuarioActual();
  if (!usuario || !puedeVerAnalitica(usuario.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = createClient();

  const { desde, hasta } = parsed.data;
  const pCanal = parsed.data.canal;

  let filename = `reporte-${tipo}-${desde}-${hasta}.csv`;
  let rows: Record<string, unknown>[] = [];

  try {
    if (tipo === "libro_ventas") {
      const { data, error } = await supabase.rpc("analytics_libro_ventas", {
        p_desde: desde,
        p_hasta: hasta,
        p_canal: pCanal,
      });
      if (error) throw new Error(error.message);
      rows = (data ?? []) as Record<string, unknown>[];
    } else if (tipo === "productos") {
      const { data, error } = await supabase.rpc("analytics_top_productos", {
        p_desde: desde,
        p_hasta: hasta,
        p_limite: 500,
        p_canal: pCanal,
      });
      if (error) throw new Error(error.message);
      rows = (data ?? []) as Record<string, unknown>[];
    } else if (tipo === "meseros") {
      const { data, error } = await supabase.rpc("analytics_por_mesero", {
        p_desde: desde,
        p_hasta: hasta,
        p_canal: pCanal,
      });
      if (error) throw new Error(error.message);
      rows = (data ?? []) as Record<string, unknown>[];
    } else if (tipo === "dashboard") {
      const pCanalRpc = canalRpc(parsed.data.canal);
      const { data: kpis, error: kpisError } = await supabase.rpc("analytics_kpis", {
        p_desde: desde,
        p_hasta: hasta,
        p_canal: pCanalRpc,
      });
      if (kpisError) throw new Error(kpisError.message);
      const k = (kpis ?? {}) as Record<string, unknown>;
      rows = [
        { metrica: "ingresos_brutos", valor: k.ingresos_brutos ?? 0 },
        { metrica: "ingresos_netos", valor: k.ingresos_netos ?? 0 },
        { metrica: "impuesto_total", valor: k.impuesto_total ?? 0 },
        { metrica: "num_ordenes", valor: k.num_ordenes ?? 0 },
        { metrica: "ticket_promedio", valor: k.ticket_promedio ?? 0 },
        { metrica: "costo_estimado", valor: k.costo_estimado ?? 0 },
        { metrica: "facturas_anuladas", valor: k.facturas_anuladas ?? 0 },
        { metrica: "generado_en", valor: new Date().toISOString() },
        { metrica: "desde", valor: desde },
        { metrica: "hasta", valor: hasta },
      ];
    } else {
      return NextResponse.json({ error: "Tipo de exportacion desconocido" }, { status: 400 });
    }

    const csv = toCsv(rows);
    const checksum = Buffer.from(csv).toString("base64").slice(0, 16);

    if (["admin", "gerente"].includes(usuario.rol)) {
      await supabase.rpc("guardar_reporte_generado", {
        p_tipo: tipo,
        p_desde: desde,
        p_hasta: hasta,
        p_canal: pCanal,
        p_payload: { rows, generado_en: new Date().toISOString(), checksum },
      });
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Report-Checksum": checksum,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al exportar" },
      { status: 500 }
    );
  }
}
