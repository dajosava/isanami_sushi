import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecetaForm } from "@/components/inventario/receta-form";
import { one } from "@/lib/relations";
import Link from "next/link";
import { clsx } from "clsx";

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

  const lista = [...(productos ?? [])].sort((a, b) => {
    const aSin = !a.recetas || a.recetas.length === 0 ? 0 : 1;
    const bSin = !b.recetas || b.recetas.length === 0 ? 0 : 1;
    if (aSin !== bSin) return aSin - bSin;
    return String(a.nombre).localeCompare(String(b.nombre), "es");
  });

  const sinReceta = lista.filter((p) => !p.recetas || p.recetas.length === 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl">Recetas (costeo por plato)</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/inventario/insumos" className="underline hover:text-white">
            Insumos
          </Link>
          <Link href="/inventario/compras" className="underline hover:text-white">
            Compras
          </Link>
        </div>
      </div>

      {sinReceta > 0 ? (
        <div className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-washi-50">
          <p className="font-medium">
            {sinReceta}{" "}
            {sinReceta === 1
              ? "producto activo sin receta"
              : "productos activos sin receta"}
          </p>
          <p className="mt-1 text-xs text-washi-50/80">
            No descontarán inventario al cobrar. Configúralos abajo (aparecen primero).
          </p>
        </div>
      ) : null}

      <RecetaForm
        productos={(productos ?? []).map((p) => ({ id: p.id, nombre: p.nombre }))}
        insumos={insumos ?? []}
        unidades={unidades ?? []}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((producto) => {
          const vacia = !producto.recetas || producto.recetas.length === 0;
          return (
            <Card
              key={producto.id}
              className={clsx(vacia && "ring-1 ring-gold/50")}
            >
              <CardHeader className="flex-row items-start justify-between gap-2">
                <CardTitle>{producto.nombre}</CardTitle>
                {vacia ? <Badge tono="advertencia">Sin receta</Badge> : null}
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
                  {vacia ? (
                    <li className="italic">Sin receta definida — no descuenta stock al vender</li>
                  ) : null}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
