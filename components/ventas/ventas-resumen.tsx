import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatColon } from "@/lib/utils";
import type { ResumenVentas } from "@/lib/ventas/cargar-resumen";

const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  sinpe: "SINPE",
  mixto: "Mixto",
};

function RankingTabla({
  titulo,
  filas,
  vacio,
}: {
  titulo: string;
  filas: ResumenVentas["topProductos"];
  vacio: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {filas.length === 0 ? (
          <p className="p-4 text-sm text-sumi-700">{vacio}</p>
        ) : (
          <table className="isanami-table w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Producto</th>
                <th className="px-4 py-2 text-right">Cant.</th>
                <th className="px-4 py-2 text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((p) => (
                <tr key={p.producto_id || p.nombre}>
                  <td className="px-4 py-2 font-medium">
                    {p.nombre}
                    {p.categoria ? (
                      <span className="mt-0.5 block text-xs font-normal text-sumi-600">
                        {p.categoria}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.cantidad}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatColon(p.ingresos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

export function VentasResumen({ resumen }: { resumen: ResumenVentas }) {
  const { kpis, pagosMetodo, topProductos, bajaRotacion, error } = resumen;

  const kpisUi = [
    { label: "Ventas totales", value: formatColon(kpis.ingresos_brutos) },
    { label: "Órdenes", value: String(kpis.num_ordenes) },
    { label: "Ticket promedio", value: formatColon(kpis.ticket_promedio) },
    { label: "IVA cobrado", value: formatColon(kpis.impuesto_total) },
  ];

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg border border-umeboshi-500/40 bg-umeboshi-500/10 p-3 text-sm text-washi-50">
          No se pudo cargar el resumen: {error}
          <span className="mt-1 block text-xs opacity-80">
            Si acabas de desplegar, aplica la migración 0027 en Supabase.
          </span>
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpisUi.map((k) => (
          <Card key={k.label}>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">{k.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xl font-semibold tabular-nums text-sumi-900">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medios de pago</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pagosMetodo.length === 0 ? (
            <p className="p-4 text-sm text-sumi-700">Sin pagos en el periodo.</p>
          ) : (
            <table className="isanami-table w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Método</th>
                  <th className="px-4 py-2 text-right">Transacciones</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {pagosMetodo.map((p) => (
                  <tr key={p.metodo}>
                    <td className="px-4 py-2 font-medium">
                      {METODO_LABEL[p.metodo] ?? p.metodo}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{p.transacciones}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatColon(p.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <RankingTabla
          titulo="Más vendidos"
          filas={topProductos}
          vacio="Sin ventas de productos en el periodo."
        />
        <RankingTabla
          titulo="Menos vendidos"
          filas={bajaRotacion}
          vacio="Sin datos de menor rotación."
        />
      </div>
    </div>
  );
}
