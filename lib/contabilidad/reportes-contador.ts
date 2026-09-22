export type ReporteContadorMensual = {
  periodo: {
    anio: number;
    mes: number;
    desde: string;
    hasta: string;
  };
  ventas: {
    total_vendido: number;
    iva_cobrado: number;
    num_facturas: number;
  };
  compras: {
    total_comprado: number;
    iva_compras_13: number;
    iva_compras_1: number;
    num_compras: number;
    compras_sin_iva_desglose: number;
  };
  resultado: {
    iva_cobrado: number;
    iva_pagado: number;
    diferencia_iva: number;
  };
  generado_en: string;
};

export type ReporteContadorAnual = {
  periodo: {
    anio: number;
    desde: string;
    hasta: string;
  };
  ventas_total: number;
  compras_mercaderia: number;
  gastos_operativos: number;
  salarios_estimados: number;
  ganancia_aproximada: number;
  generado_en: string;
};

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function parseReporteContadorMensual(raw: unknown): ReporteContadorMensual | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const periodo = o.periodo as Record<string, unknown> | undefined;
  const ventas = o.ventas as Record<string, unknown> | undefined;
  const compras = o.compras as Record<string, unknown> | undefined;
  const resultado = o.resultado as Record<string, unknown> | undefined;
  if (!periodo || !ventas || !compras || !resultado) return null;

  return {
    periodo: {
      anio: num(periodo.anio),
      mes: num(periodo.mes),
      desde: String(periodo.desde ?? ""),
      hasta: String(periodo.hasta ?? ""),
    },
    ventas: {
      total_vendido: num(ventas.total_vendido),
      iva_cobrado: num(ventas.iva_cobrado),
      num_facturas: num(ventas.num_facturas),
    },
    compras: {
      total_comprado: num(compras.total_comprado),
      iva_compras_13: num(compras.iva_compras_13),
      iva_compras_1: num(compras.iva_compras_1),
      num_compras: num(compras.num_compras),
      compras_sin_iva_desglose: num(compras.compras_sin_iva_desglose),
    },
    resultado: {
      iva_cobrado: num(resultado.iva_cobrado),
      iva_pagado: num(resultado.iva_pagado),
      diferencia_iva: num(resultado.diferencia_iva),
    },
    generado_en: String(o.generado_en ?? ""),
  };
}

export function parseReporteContadorAnual(raw: unknown): ReporteContadorAnual | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const periodo = o.periodo as Record<string, unknown> | undefined;
  if (!periodo) return null;

  return {
    periodo: {
      anio: num(periodo.anio),
      desde: String(periodo.desde ?? ""),
      hasta: String(periodo.hasta ?? ""),
    },
    ventas_total: num(o.ventas_total),
    compras_mercaderia: num(o.compras_mercaderia),
    gastos_operativos: num(o.gastos_operativos),
    salarios_estimados: num(o.salarios_estimados),
    ganancia_aproximada: num(o.ganancia_aproximada),
    generado_en: String(o.generado_en ?? ""),
  };
}

export function hoyEnCostaRica(): { anio: number; mes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const anio = Number(parts.find((p) => p.type === "year")?.value ?? new Date().getFullYear());
  const mes = Number(parts.find((p) => p.type === "month")?.value ?? 1);
  return { anio, mes };
}

export function labelMesAnio(anio: number, mes: number): string {
  const d = new Date(Date.UTC(anio, mes - 1, 1));
  return d.toLocaleDateString("es-CR", { month: "long", year: "numeric", timeZone: "UTC" });
}
