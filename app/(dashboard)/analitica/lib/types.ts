import { z } from "zod";

export const CANALES = ["salon", "para_llevar", "delivery"] as const;
export type Canal = (typeof CANALES)[number];

export const PRESETS = [
  "hoy",
  "ayer",
  "7d",
  "30d",
  "mes_actual",
  "mes_anterior",
  "personalizado",
] as const;
export type PresetFecha = (typeof PRESETS)[number];

export const filtrosAnaliticaSchema = z.object({
  preset: z.enum(PRESETS).default("30d"),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  canal: z.enum(CANALES).nullable().optional(),
});

export type FiltrosAnalitica = z.infer<typeof filtrosAnaliticaSchema>;

export interface KpisResumen {
  ingresos_brutos: number;
  ingresos_netos: number;
  impuesto_total: number;
  num_ordenes: number;
  ticket_promedio: number;
  propinas: number;
  costo_estimado: number;
  facturas_anuladas: number;
}

export interface KpisConComparacion {
  actual: KpisResumen;
  anterior: KpisResumen;
  variacion: Record<keyof KpisResumen, number | null>;
}

export interface VentaDia {
  fecha: string;
  total: number;
  ordenes: number;
}

export interface VentaHora {
  hora: number;
  total: number;
  ordenes: number;
}

export interface VentaDiaSemana {
  dia_semana: number;
  nombre: string;
  total: number;
  ordenes: number;
}

export interface ProductoRanking {
  producto_id: string;
  nombre: string;
  categoria?: string;
  cantidad: number;
  ingresos: number;
  costo_estimado?: number;
}

export interface CategoriaVenta {
  categoria: string;
  cantidad: number;
  ingresos: number;
}

export interface MeseroVenta {
  mesero_id: string;
  mesero: string;
  ordenes: number;
  ingresos: number;
}

export interface MesaVenta {
  mesa_numero: number;
  zona: string;
  ordenes: number;
  ingresos: number;
}

export interface PagoMetodo {
  metodo: string;
  total: number;
  transacciones: number;
}

export interface ConciliacionTurno {
  turno_id: string;
  cajero: string;
  abierto_en: string;
  cerrado_en: string | null;
  monto_esperado: number | null;
  monto_contado: number | null;
  diferencia: number | null;
  total_pagos: number;
}

export interface TiempoMesa {
  promedio_minutos: number;
  pedidos_cerrados: number;
}

export interface DashboardAnalitica {
  kpis: KpisConComparacion;
  ventasPorDia: VentaDia[];
  ventasPorHora: VentaHora[];
  ventasDiaSemana: VentaDiaSemana[];
  topProductos: ProductoRanking[];
  bajaRotacion: ProductoRanking[];
  porCategoria: CategoriaVenta[];
  porMesero: MeseroVenta[];
  porMesa: MesaVenta[];
  tiempoMesa: TiempoMesa;
  pagosMetodo: PagoMetodo[];
  conciliacion: ConciliacionTurno[];
  filtros: FiltrosAnalitica;
  generadoEn: string;
}

export function calcularVariacion(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual === 0 ? 0 : null;
  return ((actual - anterior) / anterior) * 100;
}

export function kpisConComparacion(actual: KpisResumen, anterior: KpisResumen): KpisConComparacion {
  const keys = Object.keys(actual) as (keyof KpisResumen)[];
  const variacion = {} as Record<keyof KpisResumen, number | null>;
  for (const k of keys) {
    variacion[k] = calcularVariacion(Number(actual[k]), Number(anterior[k]));
  }
  return { actual, anterior, variacion };
}

export function margenBruto(k: KpisResumen): number {
  return Number(k.ingresos_netos) - Number(k.costo_estimado);
}

const KPI_CERO: KpisResumen = {
  ingresos_brutos: 0,
  ingresos_netos: 0,
  impuesto_total: 0,
  num_ordenes: 0,
  ticket_promedio: 0,
  propinas: 0,
  costo_estimado: 0,
  facturas_anuladas: 0,
};

export function kpisVacios(): KpisConComparacion {
  return kpisConComparacion(KPI_CERO, KPI_CERO);
}
