"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatColon } from "@/lib/utils";
import type { ReporteContadorMensual } from "@/lib/contabilidad/reportes-contador";
import { labelMesAnio } from "@/lib/contabilidad/reportes-contador";
import Link from "next/link";

function fila({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gold/10 py-2 last:border-0">
      <dt className="text-sumi-700">{label}</dt>
      <dd className="font-medium tabular-nums text-sumi-900">{value}</dd>
    </div>
  );
}

export function ReporteContadorMensualView({
  reporte,
  anio,
  mes,
}: {
  reporte: ReporteContadorMensual | null;
  anio: number;
  mes: number;
}) {
  const router = useRouter();

  function aplicar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const a = fd.get("anio");
    const m = fd.get("mes");
    const params = new URLSearchParams();
    if (a) params.set("anio", String(a));
    if (m) params.set("mes", String(m));
    router.push(`/contabilidad/reportes/mensual?${params.toString()}`);
  }

  const exportUrl = `/api/exportar/contabilidad?tipo=mensual&anio=${anio}&mes=${mes}`;

  return (
    <div className="space-y-6">
      <form onSubmit={aplicar} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-sumi-800">Año</label>
          <Input name="anio" type="number" min={2000} max={2100} defaultValue={anio} className="w-28" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-sumi-800">Mes</label>
          <Input name="mes" type="number" min={1} max={12} defaultValue={mes} className="w-20" />
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
            Periodo: <strong className="text-washi-50">{labelMesAnio(anio, mes)}</strong> ({reporte.periodo.desde}{" "}
            → {reporte.periodo.hasta}). Cálculo en vivo al consultar.
          </p>

          {reporte.compras.compras_sin_iva_desglose > 0 ? (
            <p className="rounded-md border border-gold/30 bg-washi/10 px-3 py-2 text-sm text-washi-50/90">
              Hay {reporte.compras.compras_sin_iva_desglose} compra(s) sin IVA desglosado (datos anteriores a
              compras/gastos con IVA). El IVA pagado puede estar subestimado.
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <dl>
                  {fila({ label: "Total vendido", value: formatColon(reporte.ventas.total_vendido) })}
                  {fila({ label: "IVA cobrado", value: formatColon(reporte.ventas.iva_cobrado) })}
                  {fila({ label: "Comprobantes", value: String(reporte.ventas.num_facturas) })}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compras</CardTitle>
              </CardHeader>
              <CardContent>
                <dl>
                  {fila({ label: "Total comprado", value: formatColon(reporte.compras.total_comprado) })}
                  {fila({ label: "IVA pagado (13%)", value: formatColon(reporte.compras.iva_compras_13) })}
                  {fila({ label: "IVA pagado (1%)", value: formatColon(reporte.compras.iva_compras_1) })}
                  {fila({ label: "Facturas registradas", value: String(reporte.compras.num_compras) })}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultado IVA</CardTitle>
              </CardHeader>
              <CardContent>
                <dl>
                  {fila({ label: "Impuesto cobrado", value: formatColon(reporte.resultado.iva_cobrado) })}
                  {fila({ label: "Impuesto pagado (13%+1%)", value: formatColon(reporte.resultado.iva_pagado) })}
                  {fila({
                    label: "Diferencia aprox. Hacienda",
                    value: formatColon(reporte.resultado.diferencia_iva),
                  })}
                </dl>
                <p className="mt-3 text-xs text-sumi-600">
                  Aproximación operativa; no sustituye la declaración formal (D-104 u otros formularios).
                </p>
              </CardContent>
            </Card>
          </div>

        </>
      )}
    </div>
  );
}
