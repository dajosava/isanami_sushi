import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MesaPedidoClient } from "@/components/pedidos/mesa-pedido-client";
import { getMenuActivo } from "@/lib/pedidos/cargar-menu";

export default async function ParaLlevarPedidoPage({
  params,
}: {
  params: { pedidoId: string };
}) {
  const supabase = createClient();
  const esNuevo = params.pedidoId === "nuevo";

  const [categorias, pedidoActivo] = await Promise.all([
    getMenuActivo(),
    esNuevo
      ? Promise.resolve(null)
      : supabase
          .from("pedidos")
          .select(
            "id, estado, tipo, creado_en, pedido_items(id, cantidad, notas, estado_cocina, productos(nombre, precio_venta))"
          )
          .eq("id", params.pedidoId)
          .eq("tipo", "para_llevar")
          .is("mesa_id", null)
          .in("estado", ["abierto", "enviado", "en_preparacion", "servido"])
          .maybeSingle()
          .then(({ data }) => data),
  ]);

  if (!esNuevo && !pedidoActivo) {
    notFound();
  }

  const titulo = esNuevo
    ? "Nuevo pedido para llevar"
    : `Para llevar · ${new Date(pedidoActivo!.creado_en).toLocaleTimeString("es-CR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

  return (
    <MesaPedidoClient
      tipo="para_llevar"
      titulo={titulo}
      volverHref="/pedidos"
      categorias={categorias}
      pedidoActivo={pedidoActivo as never}
    />
  );
}
