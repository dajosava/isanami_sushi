import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsumoForm } from "@/components/inventario/insumo-form";
import { InsumosTabla } from "@/components/inventario/insumos-tabla";
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

  const filas = (insumos ?? []).map((insumo) => ({
    id: insumo.id as string,
    nombre: insumo.nombre as string,
    stock_actual: Number(insumo.stock_actual ?? 0),
    stock_minimo: Number(insumo.stock_minimo ?? 0),
    costo_unitario_promedio: Number(insumo.costo_unitario_promedio ?? 0),
    unidad: one(insumo.unidades_medida)?.abreviatura ?? "",
  }));

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
        <CardContent className="p-4 pt-0">
          <InsumosTabla insumos={filas} />
        </CardContent>
      </Card>
    </div>
  );
}
