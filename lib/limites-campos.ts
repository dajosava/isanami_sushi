/**
 * Límites de texto compartidos entre Menú, Inventario y Compras.
 * Mantener alineados para evitar nombres truncados de forma distinta por módulo.
 */
export const LIMITES = {
  productoNombre: 80,
  categoriaNombre: 40,
  /** Mismo tope que producto: se referencia cruzado en reportes e inventario */
  insumoNombre: 80,
  proveedorNombre: 80,
  /** Concepto / descripción de factura o gasto */
  compraConcepto: 160,
  /** Suficiente para "99999999.99" en colones */
  precioMax: 99_999_999.99,
  /** Vista cocina / tickets: truncar visualmente */
  comandaProductoVisible: 40,
} as const;
