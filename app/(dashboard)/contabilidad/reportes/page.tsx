import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportesPage() {
  const supabase = createClient();
  const { data: cierresDiarios } = await supabase
    .from("cierres_diarios")
    .select("id, fecha, total_ventas, total_iva, total_efectivo, total_tarjeta")
    .order("fecha", { ascending: false })
    .limit(30);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Reportes diarios</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(cierresDiarios ?? []).map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle>{new Date(c.fecha).toLocaleDateString("es-CR")}</CardTitle>
            </CardHeader>
            <CardContent>
            <dl className="space-y-1 text-sm text-sumi-700">
              <div className="flex justify-between">
                <dt>Ventas totales</dt>
                <dd>&#8353;{c.total_ventas?.toLocaleString("es-CR")}</dd>
              </div>
              <div className="flex justify-between">
                <dt>IVA recaudado</dt>
                <dd>&#8353;{c.total_iva?.toLocaleString("es-CR")}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Efectivo</dt>
                <dd>&#8353;{c.total_efectivo?.toLocaleString("es-CR")}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tarjeta</dt>
                <dd>&#8353;{c.total_tarjeta?.toLocaleString("es-CR")}</dd>
              </div>
            </dl>
            </CardContent>
          </Card>
        ))}

        {(!cierresDiarios || cierresDiarios.length === 0) && (
          <p className="text-sm text-washi-50">Todavia no hay cierres diarios generados.</p>
        )}
      </div>
    </div>
  );
}
