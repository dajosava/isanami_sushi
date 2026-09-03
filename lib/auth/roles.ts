/**
 * Roles de negocio de Isanami Sushi.
 * Se guardan en la tabla `usuarios.rol` y se reflejan en las policies RLS.
 */
export const ROLES = {
  ADMIN: "admin",
  GERENTE: "gerente",
  CAJERO: "cajero",
  MESERO: "mesero",
  COCINA: "cocina",
  CONTADOR: "contador",
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

export const RUTAS_POR_ROL: Record<Rol, string[]> = {
  admin: ["*"],
  gerente: ["/pedidos", "/cocina", "/inventario", "/contabilidad", "/facturacion", "/analitica"],
  cajero: ["/pedidos", "/facturacion"],
  mesero: ["/pedidos"],
  cocina: ["/cocina"],
  contador: ["/contabilidad", "/analitica"],
};

export function puedeAcceder(rol: Rol, ruta: string): boolean {
  const permitidas = RUTAS_POR_ROL[rol] ?? [];
  if (permitidas.includes("*")) return true;
  return permitidas.some((r) => ruta.startsWith(r));
}
