import Link from "next/link";
import { requireRolReportesContador } from "@/lib/auth/usuario";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hoyEnCostaRica } from "@/lib/contabilidad/reportes-contador";

export default async function ReportesContadorHubPage() {
  await requireRolReportesContador();
  const { anio, mes } = hoyEnCostaRica();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl">Reportes para el contador</h1>
        <Link href="/contabilidad/cierres" className="text-sm underline hover:text-white">
          Cierres de caja
        </Link>
      </div>

      <p className="mb-6 max-w-2xl text-sm text-washi-50/80">
        Información fiscal y de resultado calculada en vivo desde ventas, compras/gastos y planilla.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href={`/contabilidad/reportes/mensual?anio=${anio}&mes=${mes}`}>
          <Card className="h-full transition hover:border-gold/50">
            <CardHeader>
              <CardTitle>Reporte mensual</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-sumi-700">
              Total vendido, IVA cobrado, compras, IVA 13% / 1% y diferencia aproximada para Hacienda.
            </CardContent>
          </Card>
        </Link>

        <Link href={`/contabilidad/reportes/anual?anio=${anio}`}>
          <Card className="h-full transition hover:border-gold/50">
            <CardHeader>
              <CardTitle>Reporte anual</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-sumi-700">
              Ventas, compras (mercadería), gastos, salarios estimados y ganancia del año.
            </CardContent>
          </Card>
        </Link>

        <Link href="/contabilidad/reportes/cierres">
          <Card className="h-full transition hover:border-gold/50">
            <CardHeader>
              <CardTitle>Cierres diarios</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-sumi-700">
              Histórico de cierres consolidados por día (ventas e IVA del turno).
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
