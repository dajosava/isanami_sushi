import { createClient } from "@/lib/supabase/server";
import { MesaPedidoClient } from "@/components/pedidos/mesa-pedido-client";
import { getMenuActivo } from "@/lib/pedidos/cargar-menu";

export default async function TomarPedidoPage({ params }: { params: { mesaId: string } }) {
  const supabase = createClient();

  const [{ data: mesa }, categorias, { data: pedidoActivo }] = await Promise.all([
    supabase.from("mesas").select("id, numero, estado").eq("id", params.mesaId).single(),
    getMenuActivo(),
    supabase
      .from("pedidos")
      .select(
        "id, estado, pedido_items(id, cantidad, notas, estado_cocina, productos(nombre, precio_venta))"
      )
      .eq("mesa_id", params.mesaId)
      .in("estado", ["abierto", "enviado", "en_preparacion", "servido"])
      .maybeSingle(),
  ]);

  return (
    <MesaPedidoClient
      mesaId={params.mesaId}
      mesaNumero={mesa?.numero}
      categorias={categorias}
      pedidoActivo={pedidoActivo as never}
    />
  );
}
