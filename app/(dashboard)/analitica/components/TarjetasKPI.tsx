"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatColon } from "@/lib/utils";
import type { KpisConComparacion } from "../lib/types";
import { margenBruto } from "../lib/types";

function Variacion({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-xs text-sumi-600">—</span>;
  const positivo = valor >= 0;
  return (
    <span className={`text-xs font-medium ${positivo ? "text-wasabi-500" : "text-umeboshi-500"}`}>
      {positivo ? "+" : ""}
      {valor.toFixed(1)}% vs periodo anterior
    </span>
  );
}

function Skeleton() {
  return <div className="h-16 animate-pulse rounded-md bg-washi-200/60" />;
}

export function TarjetasKPI({
  kpis,
  cargando,
}: {
  kpis: KpisConComparacion;
  cargando?: boolean;
}) {
  const { actual, variacion } = kpis;
  const margen = margenBruto(actual);

  const tarjetas = [
    { titulo: "Ingresos brutos", valor: formatColon(actual.ingresos_brutos), var: variacion.ingresos_brutos },
    { titulo: "Ingresos netos", valor: formatColon(actual.ingresos_netos), var: variacion.ingresos_netos },
    { titulo: "Ordenes", valor: String(actual.num_ordenes), var: variacion.num_ordenes },
    { titulo: "Ticket promedio", valor: formatColon(actual.ticket_promedio), var: variacion.ticket_promedio },
    { titulo: "IVA recaudado", valor: formatColon(actual.impuesto_total), var: variacion.impuesto_total },
    { titulo: "Costo estimado", valor: formatColon(actual.costo_estimado), var: variacion.costo_estimado },
    { titulo: "Margen bruto est.", valor: formatColon(margen), var: null },
    { titulo: "Anuladas", valor: String(actual.facturas_anuladas), var: variacion.facturas_anuladas },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 md:grid-cols-4">
      {tarjetas.map((t) => (
        <Card key={t.titulo}>
          <CardHeader className="py-2">
            <CardTitle className="text-sm">{t.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {cargando ? (
              <Skeleton />
            ) : (
              <>
                <p className="text-xl font-semibold text-sumi-900">{t.valor}</p>
                <Variacion valor={t.var} />
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
