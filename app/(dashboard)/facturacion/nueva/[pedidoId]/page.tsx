import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormularioCobro } from "@/components/facturacion/formulario-cobro";
import { calcularCuentaPedido, SERVICIO_ETIQUETA } from "@/lib/facturacion/calcular-cuenta";
import { formatColon } from "@/lib/utils";
import { one } from "@/lib/relations";

export default async function NuevoComprobantePage({ params }: { params: { pedidoId: string } }) {
  const supabase = createClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, tipo, mesas(numero), pedido_items(cantidad, productos(nombre, precio_venta))")
    .eq("id", params.pedidoId)
    .single();

  const mesaNumero = one(pedido?.mesas)?.numero;
  const tipo = (pedido?.tipo ?? "salon") as "salon" | "para_llevar" | "delivery";
  const tituloCobro =
    tipo === "para_llevar" || mesaNumero == null
      ? "Cobrar pedido para llevar"
      : `Cobrar mesa ${mesaNumero}`;

  const items = pedido?.pedido_items ?? [];
  const lineas = items.map((item) => {
    const producto = one(item.productos);
    return {
      cantidad: item.cantidad,
      precioUnitario: producto?.precio_venta ?? 0,
      nombre: producto?.nombre ?? "Producto",
    };
  });

  const { subtotal, servicio, aplicaServicio, total } = calcularCuentaPedido(
    lineas.map(({ cantidad, precioUnitario }) => ({ cantidad, precioUnitario })),
    tipo,
    mesaNumero
  );

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>{tituloCobro}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="mb-4 space-y-1 text-sm text-sumi-900">
          {lineas.map((linea, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>
                {linea.cantidad}x {linea.nombre}
              </span>
              <span className="shrink-0 text-sumi-800">
                {formatColon(linea.cantidad * linea.precioUnitario)}
              </span>
            </li>
          ))}
        </ul>

        <div className="space-y-1 border-t border-washi-200 pt-3 text-sm text-sumi-900">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatColon(subtotal)}</span>
          </div>
          {aplicaServicio ? (
            <div className="flex justify-between">
              <span>{SERVICIO_ETIQUETA}</span>
              <span>{formatColon(servicio)}</span>
            </div>
          ) : null}
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatColon(total)}</span>
          </div>
          <p className="pt-1 text-xs text-sumi-600">Precios con IVA incluido.</p>
        </div>

        <FormularioCobro pedidoId={params.pedidoId} total={total} />
      </CardContent>
    </Card>
  );
}
