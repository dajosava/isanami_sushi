import { createClient } from "@/lib/supabase/server";
import { requireRolReportesContador } from "@/lib/auth/usuario";
import { ReporteContadorAnualView } from "@/components/contabilidad/reporte-contador-anual";
import { hoyEnCostaRica, parseReporteContadorAnual } from "@/lib/contabilidad/reportes-contador";

export default async function ReporteContadorAnualPage({
  searchParams,
}: {
  searchParams?: { anio?: string };
}) {
  await requireRolReportesContador();
  const hoy = hoyEnCostaRica();

  const anio = searchParams?.anio ? Number(searchParams.anio) : hoy.anio;
  const anioOk = Number.isFinite(anio) && anio >= 2000 && anio <= 2100 ? anio : hoy.anio;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("reporte_contador_anual", {
    p_anio: anioOk,
  });

  if (error) {
    console.error("[reporte anual contador]", error.message);
  }

  const reporte = parseReporteContadorAnual(data);

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl">Reporte anual — contador</h1>
      <p className="mb-6 text-sm text-washi-50/80">Ventas, compras, gastos, salarios y ganancia aproximada.</p>
      <ReporteContadorAnualView reporte={reporte} anio={anioOk} />
    </div>
  );
}
