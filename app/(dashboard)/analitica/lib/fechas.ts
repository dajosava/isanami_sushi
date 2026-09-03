import {
  endOfMonth,
  format,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import type { FiltrosAnalitica, PresetFecha } from "./types";

export function hoyCR(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
}

export function formatoFechaCR(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function rangoDesdePreset(preset: PresetFecha, customDesde?: string, customHasta?: string): {
  desde: string;
  hasta: string;
} {
  const hoy = hoyCR();
  const hasta = formatoFechaCR(hoy);

  switch (preset) {
    case "hoy":
      return { desde: hasta, hasta };
    case "ayer": {
      const ayer = subDays(hoy, 1);
      const f = formatoFechaCR(ayer);
      return { desde: f, hasta: f };
    }
    case "7d":
      return { desde: formatoFechaCR(subDays(hoy, 6)), hasta };
    case "30d":
      return { desde: formatoFechaCR(subDays(hoy, 29)), hasta };
    case "mes_actual":
      return { desde: formatoFechaCR(startOfMonth(hoy)), hasta };
    case "mes_anterior": {
      const mesAnt = subMonths(hoy, 1);
      return {
        desde: formatoFechaCR(startOfMonth(mesAnt)),
        hasta: formatoFechaCR(endOfMonth(mesAnt)),
      };
    }
    case "personalizado":
      return {
        desde: customDesde ?? hasta,
        hasta: customHasta ?? hasta,
      };
    default:
      return { desde: formatoFechaCR(subDays(hoy, 29)), hasta };
  }
}

export function periodoAnterior(desde: string, hasta: string): { desde: string; hasta: string } {
  const d0 = new Date(`${desde}T12:00:00`);
  const d1 = new Date(`${hasta}T12:00:00`);
  const dias = Math.round((d1.getTime() - d0.getTime()) / 86400000) + 1;
  const prevHasta = subDays(d0, 1);
  const prevDesde = subDays(prevHasta, dias - 1);
  return {
    desde: format(prevDesde, "yyyy-MM-dd"),
    hasta: format(prevHasta, "yyyy-MM-dd"),
  };
}

export function filtrosPorDefecto(): FiltrosAnalitica {
  const { desde, hasta } = rangoDesdePreset("30d");
  return { preset: "30d", desde, hasta, canal: null };
}

/** Borrador inicial: sin periodo aplicado (no dispara consulta). */
export function filtrosBorradorInicial(): FiltrosAnalitica {
  return { preset: "personalizado", desde: "", hasta: "", canal: null };
}

export function filtrosListos(filtros: FiltrosAnalitica): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(filtros.desde) && /^\d{4}-\d{2}-\d{2}$/.test(filtros.hasta);
}

export function canalRpc(canal: FiltrosAnalitica["canal"]): string | null {
  return canal ?? null;
}
