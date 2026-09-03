import { createClient } from "@/lib/supabase/server";
import { PedidosMesasClient } from "@/components/pedidos/pedidos-mesas-client";

export default async function PedidosPage() {
  const supabase = createClient();

  const [{ data: mesas }, { data: pedidosParaLlevar }] = await Promise.all([
    supabase.from("mesas").select("id, numero, zona, capacidad, estado").order("numero"),
    supabase
      .from("pedidos")
      .select("id, estado, creado_en, pedido_items(count)")
      .eq("tipo", "para_llevar")
      .is("mesa_id", null)
      .in("estado", ["abierto", "enviado", "en_preparacion", "servido"])
      .order("creado_en", { ascending: false }),
  ]);

  const paraLlevar =
    pedidosParaLlevar?.map((pedido) => ({
      id: pedido.id,
      estado: pedido.estado,
      creadoEn: pedido.creado_en,
      items: (pedido.pedido_items as { count: number }[] | null)?.[0]?.count ?? 0,
    })) ?? [];

  return (
    <div>
      <h1 className="mb-4 font-display text-xl text-washi-50 sm:mb-6 sm:text-2xl">Pedidos</h1>
      <PedidosMesasClient mesas={mesas ?? []} pedidosParaLlevar={paraLlevar} />
    </div>
  );
}
