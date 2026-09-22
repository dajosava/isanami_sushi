import { createClient } from "@/lib/supabase/server";

export interface VentasKpis {
  ingresos_brutos: number;
  ingresos_netos: number;
  impuesto_total: number;
  num_ordenes: number;
  ticket_promedio: number;
  facturas_anuladas: number;
}

export interface VentasPagoMetodo {
  metodo: string;
  total: number;
  transacciones: number;
}

export interface VentasProductoRanking {
  producto_id: string;
  nombre: string;
  categoria?: string;
  cantidad: number;
  ingresos: number;
}

export interface ResumenVentas {
  kpis: VentasKpis;
  pagosMetodo: VentasPagoMetodo[];
  topProductos: VentasProductoRanking[];
  bajaRotacion: VentasProductoRanking[];
  error?: string;
}

function asKpis(raw: unknown): VentasKpis {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    ingresos_brutos: Number(o.ingresos_brutos ?? 0),
    ingresos_netos: Number(o.ingresos_netos ?? 0),
    impuesto_total: Number(o.impuesto_total ?? 0),
    num_ordenes: Number(o.num_ordenes ?? 0),
    ticket_promedio: Number(o.ticket_promedio ?? 0),
    facturas_anuladas: Number(o.facturas_anuladas ?? 0),
  };
}

function asProductos(raw: unknown): VentasProductoRanking[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      producto_id: String(r.producto_id ?? r.id ?? ""),
      nombre: String(r.nombre ?? "Producto"),
      categoria: r.categoria != null ? String(r.categoria) : undefined,
      cantidad: Number(r.cantidad ?? 0),
      ingresos: Number(r.ingresos ?? 0),
    };
  });
}

function asPagos(raw: unknown): VentasPagoMetodo[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      metodo: String(r.metodo ?? "otro"),
      total: Number(r.total ?? 0),
      transacciones: Number(r.transacciones ?? 0),
    };
  });
}

/** Resumen operativo reutilizando RPCs de analítica. */
export async function cargarResumenVentas(
  desde: string,
  hasta: string
): Promise<ResumenVentas> {
  const supabase = createClient();
  const canal = null;

  const [kpisRes, pagosRes, topRes, bajaRes] = await Promise.all([
    supabase.rpc("analytics_kpis", { p_desde: desde, p_hasta: hasta, p_canal: canal }),
    supabase.rpc("analytics_pagos_metodo", { p_desde: desde, p_hasta: hasta, p_canal: canal }),
    supabase.rpc("analytics_top_productos", {
      p_desde: desde,
      p_hasta: hasta,
      p_limite: 5,
      p_canal: canal,
    }),
    supabase.rpc("analytics_baja_rotacion", {
      p_desde: desde,
      p_hasta: hasta,
      p_limite: 5,
      p_canal: canal,
    }),
  ]);

  const error =
    kpisRes.error?.message ??
    pagosRes.error?.message ??
    topRes.error?.message ??
    bajaRes.error?.message;

  if (error) {
    return {
      kpis: asKpis(null),
      pagosMetodo: [],
      topProductos: [],
      bajaRotacion: [],
      error,
    };
  }

  return {
    kpis: asKpis(kpisRes.data),
    pagosMetodo: asPagos(pagosRes.data),
    topProductos: asProductos(topRes.data),
    bajaRotacion: asProductos(bajaRes.data),
  };
}
