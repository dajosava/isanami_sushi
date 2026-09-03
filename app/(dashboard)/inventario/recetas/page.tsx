import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecetaForm } from "@/components/inventario/receta-form";
import { one } from "@/lib/relations";

export default async function RecetasPage() {
  const supabase = createClient();
  const [{ data: productos }, { data: insumos }, { data: unidades }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, recetas(cantidad_requerida, insumos(nombre, unidades_medida(abreviatura)))")
      .eq("activo", true)
      .order("nombre"),
    supabase.from("insumos").select("id, nombre").order("nombre"),
    supabase.from("unidades_medida").select("id, nombre").order("nombre"),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Recetas (costeo por plato)</h1>

      <RecetaForm
        productos={(productos ?? []).map((p) => ({ id: p.id, nombre: p.nombre }))}
        insumos={insumos ?? []}
        unidades={unidades ?? []}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(productos ?? []).map((producto) => (
          <Card key={producto.id}>
            <CardHeader>
              <CardTitle>{producto.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
            <ul className="space-y-1 text-sm text-sumi-700">
              {producto.recetas?.map((r, i) => {
                const insumo = one(r.insumos);
                return (
                  <li key={i}>
                    {r.cantidad_requerida} {one(insumo?.unidades_medida)?.abreviatura} de{" "}
                    {insumo?.nombre}
                  </li>
                );
              })}
              {(!producto.recetas || producto.recetas.length === 0) && (
                <li className="italic">Sin receta definida</li>
              )}
            </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
