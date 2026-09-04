import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MesaPedidoClient } from "@/components/pedidos/mesa-pedido-client";
import { getMenuActivo } from "@/lib/pedidos/cargar-menu";
import { formatHoraCR } from "@/lib/utils";

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
            "id, estado, tipo, creado_en, nombre_cliente, pedido_items(id, cantidad, notas, estado_cocina, productos(nombre, precio_venta))"
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
    : pedidoActivo!.nombre_cliente
      ? `Para llevar · ${pedidoActivo!.nombre_cliente}`
      : `Para llevar · ${formatHoraCR(pedidoActivo!.creado_en)}`;

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
