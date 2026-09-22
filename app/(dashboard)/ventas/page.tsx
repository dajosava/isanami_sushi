import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FacturacionLista } from "@/components/facturacion/facturacion-lista";
import { VentasFiltros } from "@/components/ventas/ventas-filtros";
import { VentasResumen } from "@/components/ventas/ventas-resumen";
import { SectionTitle } from "@/components/ui/section-title";
import { cargarResumenVentas } from "@/lib/ventas/cargar-resumen";
import { rangoPresetVentas, type PresetVentas } from "@/lib/ventas/periodo";

const PRESETS: PresetVentas[] = ["hoy", "semana", "mes", "anio", "personalizado"];

function esFecha(v?: string): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function esPreset(v?: string): v is PresetVentas {
  return !!v && (PRESETS as string[]).includes(v);
}

export default async function VentasPage({
  searchParams,
}: {
  searchParams?: { desde?: string; hasta?: string; preset?: string };
}) {
  const preset = esPreset(searchParams?.preset) ? searchParams!.preset! : undefined;

  let desdeOrdenado: string;
  let hastaOrdenado: string;

  if (preset && preset !== "personalizado") {
    const rango = rangoPresetVentas(preset);
    desdeOrdenado = rango.desde;
    hastaOrdenado = rango.hasta;
  } else if (esFecha(searchParams?.desde) && esFecha(searchParams?.hasta)) {
    desdeOrdenado =
      searchParams!.desde! <= searchParams!.hasta!
        ? searchParams!.desde!
        : searchParams!.hasta!;
    hastaOrdenado =
      searchParams!.desde! <= searchParams!.hasta!
        ? searchParams!.hasta!
        : searchParams!.desde!;
  } else {
    const rango = rangoPresetVentas("semana");
    desdeOrdenado = rango.desde;
    hastaOrdenado = rango.hasta;
  }

  const desdeIso = `${desdeOrdenado}T00:00:00-06:00`;
  const hastaIso = `${hastaOrdenado}T23:59:59.999-06:00`;

  const supabase = createClient();
  const [{ data: comprobantes }, resumen] = await Promise.all([
    supabase
      .from("facturas")
      .select("id, numero_comprobante, fecha_emision, total_comprobante, estado, medio_pago")
      .gte("fecha_emision", desdeIso)
      .lte("fecha_emision", hastaIso)
      .order("fecha_emision", { ascending: false })
      .limit(500),
    cargarResumenVentas(desdeOrdenado, hastaOrdenado),
  ]);

  return (
    <div className="space-y-4">
      <SectionTitle kanji="売上" title="Ventas" className="mb-2" />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Periodo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <VentasFiltros
            key={`${desdeOrdenado}-${hastaOrdenado}`}
            fechaDesde={desdeOrdenado}
            fechaHasta={hastaOrdenado}
          />
          <p className="text-xs text-sumi-700">
            Mostrando del {desdeOrdenado} al {hastaOrdenado} (hora Costa Rica).
          </p>
        </CardContent>
      </Card>

      <VentasResumen resumen={resumen} />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Comprobantes del periodo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <FacturacionLista comprobantes={comprobantes ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
