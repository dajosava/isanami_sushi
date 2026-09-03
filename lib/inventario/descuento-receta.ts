import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Descuenta inventario segun receta del producto.
 * En produccion lo hace la RPC Postgres dentro de crear_comprobante_venta.
 */
export async function descontarInventarioPorVenta(
  supabase: SupabaseClient,
  params: { productoId: string; cantidadVendida: number; pedidoId: string; usuarioId: string }
) {
  const { data, error } = await supabase.rpc("descontar_inventario_por_venta", {
    p_producto_id: params.productoId,
    p_cantidad_vendida: params.cantidadVendida,
    p_pedido_id: params.pedidoId,
    p_usuario_id: params.usuarioId,
  });

  if (error) throw error;
  return data;
}
