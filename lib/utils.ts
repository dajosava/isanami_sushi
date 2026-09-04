import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatColon(value: number) {
  return `\u20a1${value.toLocaleString("es-CR")}`;
}

/** Hora fija HH:mm en zona CR — evita mismatch de hidratación con toLocaleTimeString. */
export function formatHoraCR(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Costa_Rica",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}
