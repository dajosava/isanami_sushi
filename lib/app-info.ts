export const APP_INFO = {
  nombre: "Isanami Sushi — Sistema de gestión",
  descripcion:
    "Sistema de punto de venta y administración para restaurante: pedidos, cocina, ventas y facturación electrónica, inventario, compras y gastos, planilla, contabilidad y analítica.",
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0",
  fechaDespliegue: process.env.NEXT_PUBLIC_BUILD_DATE ?? null,
  commit: process.env.NEXT_PUBLIC_COMMIT_SHA || null,
  desarrollador: "David Salazar Valverde",
} as const;

export function formatearFechaDespliegue(iso: string | null): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Costa_Rica",
  }).format(fecha);
}
