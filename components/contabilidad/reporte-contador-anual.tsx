"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatColon } from "@/lib/utils";
import type { ReporteContadorAnual } from "@/lib/contabilidad/reportes-contador";
import Link from "next/link";

export function ReporteContadorAnualView({
  reporte,
  anio,
}: {
  reporte: ReporteContadorAnual | null;
  anio: number;
}) {
  const router = useRouter();

  function aplicar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const a = fd.get("anio");
    const params = new URLSearchParams();
    if (a) params.set("anio", String(a));
    router.push(`/contabilidad/reportes/anual?${params.toString()}`);
  }

  const exportUrl = `/api/exportar/contabilidad?tipo=anual&anio=${anio}`;

  const filas = reporte
    ? [
        { label: "Total ventas del año", value: formatColon(reporte.ventas_total) },
        { label: "Total compras (mercadería)", value: formatColon(reporte.compras_mercaderia) },
        { label: "Total gastos operativos", value: formatColon(reporte.gastos_operativos) },
        {
          label: "Salarios (estimado planilla)",
          value: formatColon(reporte.salarios_estimados),
        },
        {
          label: "Ganancia aproximada",
          value: formatColon(reporte.ganancia_aproximada),
          destacado: true,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <form onSubmit={aplicar} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-sumi-800">Año</label>
          <Input name="anio" type="number" min={2000} max={2100} defaultValue={anio} className="w-28" />
        </div>
        <Button type="submit" variant="secondary">
          Actualizar
        </Button>
        <a
          href={exportUrl}
          className="rounded-md border border-gold/35 bg-washi/90 px-4 py-2 text-sm font-medium text-ink hover:bg-washi"
        >
          Exportar CSV
        </a>
        <Link href="/contabilidad/reportes" className="text-sm text-washi-50/80 underline hover:text-white">
          Volver a reportes
        </Link>
      </form>

      {!reporte ? (
        <p className="text-sm text-washi-50/80">No se pudo cargar el reporte. ¿Aplicaste la migración 0030?</p>
      ) : (
        <>
          <p className="text-sm text-washi-50/80">
            Año {anio} ({reporte.periodo.desde} → {reporte.periodo.hasta}). Cálculo en vivo al consultar.
          </p>

          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Resumen anual</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1">
                {filas.map((f) => (
                  <div
                    key={f.label}
                    className={`flex justify-between gap-4 border-b border-gold/10 py-2 last:border-0 ${
                      f.destacado ? "text-base font-semibold" : ""
                    }`}
                  >
                    <dt className={f.destacado ? "text-sumi-900" : "text-sumi-700"}>{f.label}</dt>
                    <dd className="tabular-nums text-sumi-900">{f.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-sumi-600">
                Compras = categoría mercadería; gastos = limpieza, alquiler, publicidad, etc. Salarios según
                horas registradas × tarifa ₡/h (no incluye deducciones legales). Ganancia = ventas − compras −
                gastos − salarios estimados.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
