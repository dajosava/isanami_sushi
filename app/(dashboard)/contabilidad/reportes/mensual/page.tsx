import { createClient } from "@/lib/supabase/server";
import { requireRolReportesContador } from "@/lib/auth/usuario";
import { ReporteContadorMensualView } from "@/components/contabilidad/reporte-contador-mensual";
import {
  hoyEnCostaRica,
  parseReporteContadorMensual,
} from "@/lib/contabilidad/reportes-contador";

export default async function ReporteContadorMensualPage({
  searchParams,
}: {
  searchParams?: { anio?: string; mes?: string };
}) {
  await requireRolReportesContador();
  const hoy = hoyEnCostaRica();

  const anio = searchParams?.anio ? Number(searchParams.anio) : hoy.anio;
  const mes = searchParams?.mes ? Number(searchParams.mes) : hoy.mes;

  const anioOk = Number.isFinite(anio) && anio >= 2000 && anio <= 2100 ? anio : hoy.anio;
  const mesOk = Number.isFinite(mes) && mes >= 1 && mes <= 12 ? mes : hoy.mes;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("reporte_contador_mensual", {
    p_anio: anioOk,
    p_mes: mesOk,
  });

  if (error) {
    console.error("[reporte mensual contador]", error.message);
  }

  const reporte = parseReporteContadorMensual(data);

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl">Reporte mensual — contador</h1>
      <p className="mb-6 text-sm text-washi-50/80">IVA en ventas y compras del mes.</p>
      <ReporteContadorMensualView reporte={reporte} anio={anioOk} mes={mesOk} />
    </div>
  );
}
