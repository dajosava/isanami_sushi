import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsumoForm } from "@/components/inventario/insumo-form";
import { formatColon } from "@/lib/utils";
import { one } from "@/lib/relations";
import Link from "next/link";

export default async function InsumosPage() {
  const supabase = createClient();
  const [{ data: insumos }, { data: unidades }] = await Promise.all([
    supabase
      .from("insumos")
      .select("id, nombre, stock_actual, stock_minimo, costo_unitario_promedio, unidades_medida(abreviatura)")
      .order("nombre"),
    supabase.from("unidades_medida").select("id, nombre, abreviatura").order("nombre"),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl">Insumos</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/inventario/compras" className="underline hover:text-white">
            Compras
          </Link>
          <Link href="/inventario/recetas" className="underline hover:text-white">
            Recetas
          </Link>
        </div>
      </div>

      <InsumoForm unidades={unidades ?? []} />

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Listado de insumos</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
        <table className="isanami-table w-full text-sm">
          <thead className="text-left">
            <tr>
              <th className="px-4 py-2">Insumo</th>
              <th className="px-4 py-2">Stock actual</th>
              <th className="px-4 py-2">Stock minimo</th>
              <th className="px-4 py-2">Costo promedio</th>
              <th className="px-4 py-2">Alerta</th>
            </tr>
          </thead>
          <tbody>
            {(insumos ?? []).map((insumo) => {
              const bajoMinimo = Number(insumo.stock_actual) <= Number(insumo.stock_minimo);
              return (
                <tr key={insumo.id} className="border-b border-washi-200">
                  <td className="px-4 py-2 font-medium">{insumo.nombre}</td>
                  <td className="px-4 py-2">
                    {insumo.stock_actual} {one(insumo.unidades_medida)?.abreviatura}
                  </td>
                  <td className="px-4 py-2">
                    {insumo.stock_minimo} {one(insumo.unidades_medida)?.abreviatura}
                  </td>
                  <td className="px-4 py-2">
                    {formatColon(Number(insumo.costo_unitario_promedio ?? 0))}
                  </td>
                  <td className="px-4 py-2">
                    {bajoMinimo && <Badge tono="peligro">Reabastecer</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(!insumos || insumos.length === 0) && (
          <p className="p-4 text-sm text-sumi-700">Todavia no hay insumos registrados.</p>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
