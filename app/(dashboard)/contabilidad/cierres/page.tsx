import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CajaControls } from "@/components/contabilidad/caja-controls";
import { formatColon } from "@/lib/utils";
import { one } from "@/lib/relations";
import Link from "next/link";

export default async function CierresPage() {
  const supabase = createClient();
  const { data: turnos } = await supabase
    .from("turnos_caja")
    .select(
      "id, abierto_en, cerrado_en, monto_apertura, monto_esperado, monto_contado, diferencia, estado, usuarios(nombre)"
    )
    .order("abierto_en", { ascending: false })
    .limit(30);

  const turnoAbierto = turnos?.find((t) => t.estado === "abierto");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl">Cierres de caja por turno</h1>
        <Link href="/contabilidad/reportes" className="text-sm underline hover:text-white">
          Reportes diarios
        </Link>
      </div>

      <CajaControls turnoAbiertoId={turnoAbierto?.id ?? null} />

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Turnos de caja</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
        <table className="isanami-table w-full text-sm">
          <thead className="text-left">
            <tr>
              <th className="px-4 py-2">Cajero</th>
              <th className="px-4 py-2">Apertura</th>
              <th className="px-4 py-2">Esperado</th>
              <th className="px-4 py-2">Contado</th>
              <th className="px-4 py-2">Diferencia</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {(turnos ?? []).map((t) => (
              <tr key={t.id} className="border-b border-washi-200">
                <td className="px-4 py-2 font-medium">{one(t.usuarios)?.nombre}</td>
                <td className="px-4 py-2">{new Date(t.abierto_en).toLocaleString("es-CR")}</td>
                <td className="px-4 py-2">
                  {t.monto_esperado != null ? formatColon(Number(t.monto_esperado)) : "—"}
                </td>
                <td className="px-4 py-2">
                  {t.monto_contado != null ? formatColon(Number(t.monto_contado)) : "—"}
                </td>
                <td className="px-4 py-2">
                  {t.diferencia != null && (
                    <Badge tono={t.diferencia === 0 ? "exito" : t.diferencia > 0 ? "info" : "peligro"}>
                      {formatColon(Number(t.diferencia))}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-2 capitalize">{t.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!turnos || turnos.length === 0) && (
          <p className="p-4 text-sm text-sumi-700">Todavia no hay turnos de caja registrados.</p>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
