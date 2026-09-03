"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatColon } from "@/lib/utils";
import type { ConciliacionTurno } from "../lib/types";

export function CierreCajaTable({
  datos,
  cargando,
}: {
  datos: ConciliacionTurno[];
  cargando?: boolean;
}) {
  return (
    <Card className="overflow-x-auto">
      <CardHeader>
        <CardTitle>Conciliacion de caja (turnos vs pagos)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {cargando && datos.length === 0 ? (
          <div className="m-4 h-32 animate-pulse rounded-md bg-washi-200/60" />
        ) : datos.length === 0 ? (
          <p className="p-4 text-sm text-sumi-700">No hay turnos en este periodo.</p>
        ) : (
          <table className="isanami-table w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Cajero</th>
                <th className="px-4 py-2 text-left">Apertura</th>
                <th className="px-4 py-2 text-right">Esperado</th>
                <th className="px-4 py-2 text-right">Contado</th>
                <th className="px-4 py-2 text-right">Pagos reg.</th>
                <th className="px-4 py-2 text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((t) => (
                <tr key={t.turno_id}>
                  <td className="px-4 py-2">{t.cajero}</td>
                  <td className="px-4 py-2">
                    {new Date(t.abierto_en).toLocaleString("es-CR")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {t.monto_esperado != null ? formatColon(Number(t.monto_esperado)) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {t.monto_contado != null ? formatColon(Number(t.monto_contado)) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">{formatColon(Number(t.total_pagos))}</td>
                  <td className="px-4 py-2 text-right">
                    {t.diferencia != null ? formatColon(Number(t.diferencia)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
