import { createClient } from "@/lib/supabase/server";
import type {
  CategoriaVenta,
  ConciliacionTurno,
  DashboardAnalitica,
  FiltrosAnalitica,
  KpisResumen,
  MesaVenta,
  MeseroVenta,
  PagoMetodo,
  ProductoRanking,
  TiempoMesa,
  VentaDia,
  VentaDiaSemana,
  VentaHora,
} from "./types";
import { kpisConComparacion } from "./types";
import { canalRpc, periodoAnterior } from "./fechas";

function asKpis(raw: unknown): KpisResumen {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    ingresos_brutos: Number(o.ingresos_brutos ?? 0),
    ingresos_netos: Number(o.ingresos_netos ?? 0),
    impuesto_total: Number(o.impuesto_total ?? 0),
    num_ordenes: Number(o.num_ordenes ?? 0),
    ticket_promedio: Number(o.ticket_promedio ?? 0),
    propinas: Number(o.propinas ?? 0),
    costo_estimado: Number(o.costo_estimado ?? 0),
    facturas_anuladas: Number(o.facturas_anuladas ?? 0),
  };
}

function asArray<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

function mapDashboardPayload(
  filtros: FiltrosAnalitica,
  payload: Record<string, unknown>
): DashboardAnalitica {
  const tiempoRow = (payload.tiempo_mesa ?? {}) as TiempoMesa;

  return {
    filtros,
    generadoEn: new Date().toISOString(),
    kpis: kpisConComparacion(asKpis(payload.kpis_actual), asKpis(payload.kpis_anterior)),
    ventasPorDia: asArray<VentaDia>(payload.ventas_por_dia),
    ventasPorHora: asArray<VentaHora>(payload.ventas_por_hora),
    ventasDiaSemana: asArray<VentaDiaSemana>(payload.ventas_dia_semana),
    topProductos: asArray<ProductoRanking>(payload.top_productos),
    bajaRotacion: asArray<ProductoRanking>(payload.baja_rotacion),
    porCategoria: asArray<CategoriaVenta>(payload.por_categoria),
    porMesero: asArray<MeseroVenta>(payload.por_mesero),
    porMesa: asArray<MesaVenta>(payload.por_mesa),
    tiempoMesa: {
      promedio_minutos: Number(tiempoRow.promedio_minutos ?? 0),
      pedidos_cerrados: Number(tiempoRow.pedidos_cerrados ?? 0),
    },
    pagosMetodo: asArray<PagoMetodo>(payload.pagos_metodo),
    conciliacion: asArray<ConciliacionTurno>(payload.conciliacion),
  };
}

/** Fallback: RPCs individuales si aún no está aplicada la migración 0018 */
async function cargarDashboardLegacy(
  supabase: ReturnType<typeof createClient>,
  filtros: FiltrosAnalitica
): Promise<DashboardAnalitica> {
  const canal = canalRpc(filtros.canal);
  const prev = periodoAnterior(filtros.desde, filtros.hasta);

  const rpc = (name: string, params: Record<string, unknown>) =>
    supabase.rpc(name as never, params as never);

  const [
    kpisActualRes,
    kpisPrevRes,
    ventasDiaRes,
    ventasHoraRes,
    diaSemanaRes,
    topRes,
    bajaRes,
    catRes,
    meseroRes,
    mesaRes,
    tiempoRes,
    pagosRes,
    concRes,
  ] = await Promise.all([
    rpc("analytics_kpis", { p_desde: filtros.desde, p_hasta: filtros.hasta, p_canal: canal }),
    rpc("analytics_kpis", { p_desde: prev.desde, p_hasta: prev.hasta, p_canal: canal }),
    rpc("analytics_ventas_por_dia", { p_desde: filtros.desde, p_hasta: filtros.hasta, p_canal: canal }),
    rpc("analytics_ventas_por_hora", { p_desde: filtros.desde, p_hasta: filtros.hasta, p_canal: canal }),
    rpc("analytics_ventas_dia_semana", { p_desde: filtros.desde, p_hasta: filtros.hasta, p_canal: canal }),
    rpc("analytics_top_productos", { p_desde: filtros.desde, p_hasta: filtros.hasta, p_limite: 10, p_canal: canal }),
    rpc("analytics_baja_rotacion", { p_desde: filtros.desde, p_hasta: filtros.hasta, p_limite: 10, p_canal: canal }),
    rpc("analytics_por_categoria", { p_desde: filtros.desde, p_hasta: filtros.hasta, p_canal: canal }),
    rpc("analytics_por_mesero", { p_desde: filtros.desde, p_hasta: filtros.hasta, p_canal: canal }),
    rpc("analytics_por_mesa", { p_desde: filtros.desde, p_hasta: filtros.hasta, p_canal: canal }),
    rpc("analytics_tiempo_mesa", { p_desde: filtros.desde, p_hasta: filtros.hasta, p_canal: canal }),
    rpc("analytics_pagos_metodo", { p_desde: filtros.desde, p_hasta: filtros.hasta, p_canal: canal }),
    rpc("analytics_conciliacion_caja", { p_desde: filtros.desde, p_hasta: filtros.hasta }),
  ]);

  const firstError = [
    kpisActualRes,
    kpisPrevRes,
    ventasDiaRes,
    ventasHoraRes,
    diaSemanaRes,
    topRes,
    bajaRes,
    catRes,
    meseroRes,
    mesaRes,
    tiempoRes,
    pagosRes,
    concRes,
  ].find((r) => r.error);

  if (firstError?.error) {
    throw new Error(firstError.error.message);
  }

  const tiempoRow = (tiempoRes.data?.[0] ?? {}) as TiempoMesa;

  return {
    filtros,
    generadoEn: new Date().toISOString(),
    kpis: kpisConComparacion(asKpis(kpisActualRes.data), asKpis(kpisPrevRes.data)),
    ventasPorDia: (ventasDiaRes.data ?? []) as VentaDia[],
    ventasPorHora: (ventasHoraRes.data ?? []) as VentaHora[],
    ventasDiaSemana: (diaSemanaRes.data ?? []) as VentaDiaSemana[],
    topProductos: (topRes.data ?? []) as ProductoRanking[],
    bajaRotacion: (bajaRes.data ?? []) as ProductoRanking[],
    porCategoria: (catRes.data ?? []) as CategoriaVenta[],
    porMesero: (meseroRes.data ?? []) as MeseroVenta[],
    porMesa: (mesaRes.data ?? []) as MesaVenta[],
    tiempoMesa: {
      promedio_minutos: Number(tiempoRow.promedio_minutos ?? 0),
      pedidos_cerrados: Number(tiempoRow.pedidos_cerrados ?? 0),
    },
    pagosMetodo: (pagosRes.data ?? []) as PagoMetodo[],
    conciliacion: (concRes.data ?? []) as ConciliacionTurno[],
  };
}

export async function cargarDashboardAnalitica(
  filtros: FiltrosAnalitica
): Promise<DashboardAnalitica> {
  const supabase = createClient();
  const canal = canalRpc(filtros.canal);

  const { data, error } = await supabase.rpc("analytics_dashboard", {
    p_desde: filtros.desde,
    p_hasta: filtros.hasta,
    p_canal: canal,
  });

  if (error) {
    if (error.message.includes("analytics_dashboard") || error.code === "PGRST202") {
      return cargarDashboardLegacy(supabase, filtros);
    }
    throw new Error(error.message);
  }

  return mapDashboardPayload(filtros, (data ?? {}) as Record<string, unknown>);
}
