export type TipoPedidoCuenta = "salon" | "para_llevar" | "delivery";

export const SERVICIO_PCT = 0.1;
export const SERVICIO_ETIQUETA = "Servicio (10%)";

function redondearColon(monto: number): number {
  return Math.round(monto * 100) / 100;
}

export function aplicaServicioMesa(
  tipo: TipoPedidoCuenta | undefined,
  mesaNumero?: number | null
): boolean {
  if (tipo === "para_llevar" || tipo === "delivery") return false;
  if (tipo === "salon") return true;
  return mesaNumero != null;
}

export function montoServicio(subtotal: number): number {
  return redondearColon(subtotal * SERVICIO_PCT);
}

export function calcularCuentaPedido(
  lineas: { cantidad: number; precioUnitario: number }[],
  tipo: TipoPedidoCuenta,
  mesaNumero?: number | null
) {
  const subtotal = redondearColon(
    lineas.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0)
  );
  const aplicaServicio = aplicaServicioMesa(tipo, mesaNumero);
  const servicio = aplicaServicio ? montoServicio(subtotal) : 0;
  const total = redondearColon(subtotal + servicio);

  return { subtotal, servicio, aplicaServicio, total };
}

/** Servicio explícito en comprobante ya guardado. */
export function servicioComprobante(
  subtotal: number,
  tipo: TipoPedidoCuenta | undefined,
  opts?: { totalServicioDb?: number | null; mesaNumero?: number | null }
): number {
  if (!aplicaServicioMesa(tipo, opts?.mesaNumero)) return 0;

  if (opts?.totalServicioDb != null && Number(opts.totalServicioDb) >= 0) {
    return Number(opts.totalServicioDb);
  }

  return montoServicio(subtotal);
}
