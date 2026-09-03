import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatColon(value: number) {
  return `\u20a1${value.toLocaleString("es-CR")}`;
}
