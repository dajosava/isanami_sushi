"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatColon } from "@/lib/utils";
import type { MesaVenta, MeseroVenta, TiempoMesa } from "../lib/types";

export function TablaOperacion({
  porMesero,
  porMesa,
  tiempoMesa,
  cargando,
}: {
  porMesero: MeseroVenta[];
  porMesa: MesaVenta[];
  tiempoMesa: TiempoMesa;
  cargando?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ventas por mesero</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {cargando && porMesero.length === 0 ? (
            <div className="m-4 h-24 animate-pulse rounded-md bg-washi-200/60" />
          ) : porMesero.length === 0 ? (
            <p className="p-4 text-sm text-sumi-700">Sin datos de meseros.</p>
          ) : (
            <table className="isanami-table w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Mesero</th>
                  <th className="px-4 py-2 text-right">Ordenes</th>
                  <th className="px-4 py-2 text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {porMesero.map((m) => (
                  <tr key={m.mesero_id}>
                    <td className="px-4 py-2">{m.mesero}</td>
                    <td className="px-4 py-2 text-right">{m.ordenes}</td>
                    <td className="px-4 py-2 text-right">{formatColon(Number(m.ingresos))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mesas y tiempo promedio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-sumi-700">
            Tiempo promedio de mesa:{" "}
            <strong>{Number(tiempoMesa.promedio_minutos).toFixed(0)} min</strong> (
            {tiempoMesa.pedidos_cerrados} pedidos cerrados)
          </p>
          {porMesa.length === 0 ? (
            <p className="text-sm text-sumi-700">Sin ventas por mesa.</p>
          ) : (
            <table className="isanami-table w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Mesa</th>
                  <th className="px-4 py-2 text-left">Zona</th>
                  <th className="px-4 py-2 text-right">Ordenes</th>
                  <th className="px-4 py-2 text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {porMesa.map((m, i) => (
                  <tr key={`${m.mesa_numero}-${i}`}>
                    <td className="px-4 py-2">{m.mesa_numero ?? "—"}</td>
                    <td className="px-4 py-2">{m.zona}</td>
                    <td className="px-4 py-2 text-right">{m.ordenes}</td>
                    <td className="px-4 py-2 text-right">{formatColon(Number(m.ingresos))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
