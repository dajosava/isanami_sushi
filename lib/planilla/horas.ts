/** Utilidades de horas para planilla / pago. */

export function minutosDesdeHora(valor: string | null | undefined): number | null {
  if (!valor) return null;
  const match = String(valor).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** Minutos trabajados (salida - entrada). null si faltan horas. */
export function minutosTrabajados(
  horaEntrada: string | null | undefined,
  horaSalida: string | null | undefined
): number | null {
  const ini = minutosDesdeHora(horaEntrada);
  const fin = minutosDesdeHora(horaSalida);
  if (ini == null || fin == null) return null;
  const diff = fin - ini;
  return diff >= 0 ? diff : null;
}

export function minutosAHorasDecimal(minutos: number): number {
  return Math.round((minutos / 60) * 100) / 100;
}

/** Formato legible 7h 30m */
export function formatearDuracion(minutos: number | null): string {
  if (minutos == null) return "—";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatearHorasDecimal(minutos: number | null): string {
  if (minutos == null) return "—";
  return minutosAHorasDecimal(minutos).toFixed(2);
}
