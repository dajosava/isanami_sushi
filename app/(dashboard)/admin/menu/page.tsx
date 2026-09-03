import { createClient } from "@/lib/supabase/server";
import { MenuAdminClient } from "@/components/admin/menu-admin-client";

export default async function MenuAdminPage() {
  const supabase = createClient();
  const [{ data: productos }, { data: categorias }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, precio_venta, activo, tipo, categoria_id, categorias_menu(nombre)")
      .order("nombre"),
    supabase.from("categorias_menu").select("id, nombre").order("orden"),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Menu</h1>
      <MenuAdminClient
        productos={(productos ?? []) as never}
        categorias={categorias ?? []}
      />
    </div>
  );
}
