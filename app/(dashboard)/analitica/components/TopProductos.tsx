"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatColon } from "@/lib/utils";
import type { ProductoRanking } from "../lib/types";

export function TopProductos({
  titulo,
  datos,
  cargando,
  baja,
}: {
  titulo: string;
  datos: ProductoRanking[];
  cargando?: boolean;
  baja?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {cargando && datos.length === 0 ? (
          <div className="m-4 h-40 animate-pulse rounded-md bg-washi-200/60" />
        ) : datos.length === 0 ? (
          <p className="p-4 text-sm text-sumi-700">Sin datos de productos.</p>
        ) : (
          <table className="isanami-table w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Producto</th>
                {!baja && <th className="px-4 py-2 text-left">Categoria</th>}
                <th className="px-4 py-2 text-right">Cant.</th>
                <th className="px-4 py-2 text-right">Ingresos</th>
                {!baja && <th className="px-4 py-2 text-right">Margen est.</th>}
              </tr>
            </thead>
            <tbody>
              {datos.map((p) => {
                const costo = Number(p.costo_estimado ?? 0);
                const margen = Number(p.ingresos) - costo;
                return (
                  <tr key={p.producto_id}>
                    <td className="px-4 py-2 font-medium">{p.nombre}</td>
                    {!baja && <td className="px-4 py-2">{p.categoria ?? "—"}</td>}
                    <td className="px-4 py-2 text-right">{p.cantidad}</td>
                    <td className="px-4 py-2 text-right">{formatColon(Number(p.ingresos))}</td>
                    {!baja && (
                      <td className="px-4 py-2 text-right">{formatColon(margen)}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
