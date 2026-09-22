import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatColon } from "@/lib/utils";
import { one } from "@/lib/relations";
import {
  aplicaServicioMesa,
  servicioComprobante,
  SERVICIO_ETIQUETA,
  type TipoPedidoCuenta,
} from "@/lib/facturacion/calcular-cuenta";
import { getRestauranteConfig } from "@/lib/restaurante/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/facturacion/print-button";

export default async function ComprobanteDetallePage({
  params,
}: {
  params: { facturaId: string };
}) {
  const supabase = createClient();

  const [{ data: factura, error }, config] = await Promise.all([
    supabase
      .from("facturas")
      .select(
        "id, numero_comprobante, fecha_emision, medio_pago, subtotal, total_impuesto, total_comprobante, estado, factura_items(cantidad, precio_unitario, monto_total, productos(nombre)), pedidos(tipo, mesas(numero))"
      )
      .eq("id", params.facturaId)
      .maybeSingle(),
    getRestauranteConfig(),
  ]);

  if (error || !factura) notFound();

  const pedido = one(factura.pedidos);
  const tipoPedido = pedido?.tipo as TipoPedidoCuenta | undefined;
  const mesaNumero = one(pedido?.mesas)?.numero;
  const origen =
    tipoPedido === "para_llevar"
      ? "Para llevar"
      : mesaNumero != null
        ? `Mesa ${mesaNumero}`
        : "—";

  const aplicaServicio = aplicaServicioMesa(tipoPedido, mesaNumero);
  const servicio = servicioComprobante(Number(factura.subtotal), tipoPedido, {
    mesaNumero,
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <Card className="print:border-0 print:bg-white print:shadow-none">
        <CardHeader className="print:hidden">
          <CardTitle>Comprobante {factura.numero_comprobante}</CardTitle>
        </CardHeader>
        <CardContent className="print:bg-white print:p-0">
      <article className="p-2 print:p-0">
        <header className="mb-6 text-center">
          <h1 className="font-display text-2xl text-sumi-900">{config?.nombre_comercial ?? "Isanami Sushi"}</h1>
          <p className="text-sm text-sumi-700">
            {config?.canton}, {config?.provincia}
            {config?.cedula_juridica ? ` · ${config.cedula_juridica}` : ""}
          </p>
          <p className="mt-2 text-sm font-medium">Comprobante {factura.numero_comprobante}</p>
          <p className="text-xs text-sumi-700">
            {new Date(factura.fecha_emision).toLocaleString("es-CR")} · {origen} ·{" "}
            {factura.estado}
          </p>
        </header>

        <ul className="mb-4 space-y-2 text-sm">
          {(factura.factura_items ?? []).map((item, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>
                {item.cantidad}x {one(item.productos)?.nombre}
              </span>
              <span>{formatColon(Number(item.monto_total))}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-1 border-t border-washi-200 pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatColon(Number(factura.subtotal))}</span>
          </div>
          {aplicaServicio ? (
            <div className="flex justify-between">
              <span>{SERVICIO_ETIQUETA}</span>
              <span>{formatColon(servicio)}</span>
            </div>
          ) : null}
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatColon(Number(factura.total_comprobante))}</span>
          </div>
          <div className="flex justify-between capitalize">
            <span>Pago</span>
            <span>{factura.medio_pago}</span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-sumi-700">
          Precios con IVA incluido. Comprobante interno de cobro.
        </p>
      </article>
        </CardContent>
      </Card>
    </div>
  );
}
