import { unstable_cache } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { CategoriaMenu } from "@/components/pedidos/mesa-pedido-client";

export const MENU_CACHE_TAG = "menu-activo";

async function fetchMenuActivo(): Promise<CategoriaMenu[]> {
  const supabase = createServiceRoleClient();

  const [{ data: categorias }, { data: productos }] = await Promise.all([
    supabase.from("categorias_menu").select("id, nombre, orden").order("orden"),
    supabase
      .from("productos")
      .select("id, nombre, precio_venta, descripcion, categoria_id")
      .eq("activo", true)
      .order("nombre"),
  ]);

  const productosPorCategoria = new Map<string, NonNullable<typeof productos>>();
  for (const producto of productos ?? []) {
    if (!producto.categoria_id) continue;
    const lista = productosPorCategoria.get(producto.categoria_id) ?? [];
    lista.push(producto);
    productosPorCategoria.set(producto.categoria_id, lista);
  }

  return (categorias ?? [])
    .map((categoria) => ({
      id: categoria.id,
      nombre: categoria.nombre,
      productos: productosPorCategoria.get(categoria.id) ?? [],
    }))
    .filter((categoria) => categoria.productos.length > 0);
}

/** Menú activo cacheado 5 min — invalidar con revalidateTag(MENU_CACHE_TAG) al editar catálogo. */
export const getMenuActivo = unstable_cache(fetchMenuActivo, ["menu-activo"], {
  revalidate: 300,
  tags: [MENU_CACHE_TAG],
});

/** Compatibilidad con llamadas existentes que pasaban supabase. */
export async function cargarMenuActivo(): Promise<CategoriaMenu[]> {
  return getMenuActivo();
}
