import { format, startOfMonth, startOfYear, subDays } from "date-fns";

export type PresetVentas = "hoy" | "semana" | "mes" | "anio" | "personalizado";

export function hoyCR(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
}

export function formatoFechaCR(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function rangoPresetVentas(
  preset: PresetVentas,
  customDesde?: string,
  customHasta?: string
): { desde: string; hasta: string } {
  const hoy = hoyCR();
  const hasta = formatoFechaCR(hoy);

  switch (preset) {
    case "hoy":
      return { desde: hasta, hasta };
    case "semana":
      return { desde: formatoFechaCR(subDays(hoy, 6)), hasta };
    case "mes":
      return { desde: formatoFechaCR(startOfMonth(hoy)), hasta };
    case "anio":
      return { desde: formatoFechaCR(startOfYear(hoy)), hasta };
    case "personalizado":
      return {
        desde: customDesde && /^\d{4}-\d{2}-\d{2}$/.test(customDesde) ? customDesde : hasta,
        hasta: customHasta && /^\d{4}-\d{2}-\d{2}$/.test(customHasta) ? customHasta : hasta,
      };
    default:
      return { desde: formatoFechaCR(subDays(hoy, 6)), hasta };
  }
}

export function detectarPreset(desde: string, hasta: string): PresetVentas {
  const presets: PresetVentas[] = ["hoy", "semana", "mes", "anio"];
  for (const p of presets) {
    const r = rangoPresetVentas(p);
    if (r.desde === desde && r.hasta === hasta) return p;
  }
  return "personalizado";
}
