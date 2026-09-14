import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FacturacionLista } from "@/components/facturacion/facturacion-lista";
import { FacturacionFiltros } from "@/components/facturacion/facturacion-filtros";
import { SectionTitle } from "@/components/ui/section-title";

function hoyCR(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function haceDiasCR(dias: number): string {
  const base = new Date(`${hoyCR()}T12:00:00-06:00`);
  base.setDate(base.getDate() - dias);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(base);
}

function esFecha(v?: string): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export default async function FacturacionPage({
  searchParams,
}: {
  searchParams?: { desde?: string; hasta?: string };
}) {
  const fechaHasta = esFecha(searchParams?.hasta) ? searchParams!.hasta! : hoyCR();
  const fechaDesde = esFecha(searchParams?.desde) ? searchParams!.desde! : haceDiasCR(7);
  const desdeOrdenado = fechaDesde <= fechaHasta ? fechaDesde : fechaHasta;
  const hastaOrdenado = fechaDesde <= fechaHasta ? fechaHasta : fechaDesde;

  // Rango inclusivo en hora Costa Rica (UTC-6)
  const desdeIso = `${desdeOrdenado}T00:00:00-06:00`;
  const hastaIso = `${hastaOrdenado}T23:59:59.999-06:00`;

  const supabase = createClient();
  const { data: comprobantes } = await supabase
    .from("facturas")
    .select("id, numero_comprobante, fecha_emision, total_comprobante, estado, medio_pago")
    .gte("fecha_emision", desdeIso)
    .lte("fecha_emision", hastaIso)
    .order("fecha_emision", { ascending: false })
    .limit(500);

  return (
    <div>
      <SectionTitle kanji="会計" title="Comprobantes de cobro" className="mb-6" />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Comprobantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 border-b border-washi-200">
          <FacturacionFiltros
            key={`${desdeOrdenado}-${hastaOrdenado}`}
            fechaDesde={desdeOrdenado}
            fechaHasta={hastaOrdenado}
          />
          <p className="text-xs text-sumi-700">
            Mostrando del {desdeOrdenado} al {hastaOrdenado} (hora Costa Rica).
          </p>
        </CardContent>
        <CardContent className="p-0">
          <FacturacionLista comprobantes={comprobantes ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
