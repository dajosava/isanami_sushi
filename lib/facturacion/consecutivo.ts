/**
 * Genera el siguiente numero de comprobante interno.
 * Formato: ISN-000123 (se puede ajustar el prefijo/longitud segun el cliente).
 *
 * IMPORTANTE: el incremento real del consecutivo debe hacerse dentro de una
 * transaccion/RPC en Postgres (ver migraciones) para evitar condiciones de
 * carrera si dos cajeros facturan al mismo tiempo. Esta funcion solo formatea.
 */
export function formatearConsecutivo(numero: number, prefijo = "ISN"): string {
  return `${prefijo}-${numero.toString().padStart(6, "0")}`;
}
