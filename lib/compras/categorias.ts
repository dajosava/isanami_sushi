export const CATEGORIAS_GASTO = [
  { value: "mercaderia", label: "Mercadería" },
  { value: "limpieza", label: "Limpieza" },
  { value: "publicidad", label: "Publicidad" },
  { value: "alquiler", label: "Alquiler" },
  { value: "servicios_publicos", label: "Servicios públicos" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "otros", label: "Otros" },
] as const;

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number]["value"];

export const TASAS_IVA_COMPRA = [
  { value: 13, label: "IVA 13%" },
  { value: 1, label: "IVA 1%" },
  { value: 0, label: "Exento (0%)" },
] as const;

export type TasaIvaCompra = (typeof TASAS_IVA_COMPRA)[number]["value"];

export function esCategoriaGasto(v: string): v is CategoriaGasto {
  return CATEGORIAS_GASTO.some((c) => c.value === v);
}

export function esTasaIvaCompra(v: number): v is TasaIvaCompra {
  return v === 0 || v === 1 || v === 13;
}

export function labelCategoriaGasto(value: string): string {
  return CATEGORIAS_GASTO.find((c) => c.value === value)?.label ?? value;
}

/** Redondeo a 2 decimales (colones). */
export function redondearColon(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcularMontosCompra(subtotal: number, ivaPct: number) {
  const base = redondearColon(Math.max(0, subtotal));
  const impuesto = redondearColon(base * (ivaPct / 100));
  const total = redondearColon(base + impuesto);
  return { subtotal: base, totalImpuesto: impuesto, total };
}
