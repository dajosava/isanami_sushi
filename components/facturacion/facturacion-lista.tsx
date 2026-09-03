"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FacturaAcciones } from "@/components/facturacion/factura-acciones";
import { formatColon } from "@/lib/utils";

const ESTADO_TONO = { abierta: "info", cobrada: "exito", anulada: "peligro" } as const;

export interface ComprobanteRow {
  id: string;
  numero_comprobante: string;
  fecha_emision: string;
  total_comprobante: number;
  estado: string;
  medio_pago: string;
}

export function FacturacionLista({ comprobantes }: { comprobantes: ComprobanteRow[] }) {
  if (comprobantes.length === 0) {
    return <p className="p-4 text-sm text-sumi-700">Todavia no hay comprobantes generados.</p>;
  }

  return (
    <>
      <div className="space-y-3 p-4 md:hidden">
        {comprobantes.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex-row items-start justify-between gap-2 py-3">
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{c.numero_comprobante}</CardTitle>
                <p className="mt-1 text-xs text-sumi-700">
                  {new Date(c.fecha_emision).toLocaleDateString("es-CR")} ·{" "}
                  <span className="capitalize">{c.medio_pago}</span>
                </p>
              </div>
              <Badge tono={ESTADO_TONO[c.estado as keyof typeof ESTADO_TONO] ?? "neutro"}>
                {c.estado}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-lg font-semibold text-sumi-900">
                {formatColon(Number(c.total_comprobante))}
              </p>
              <FacturaAcciones facturaId={c.id} estado={c.estado} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="isanami-table w-full text-sm">
          <thead className="text-left">
            <tr>
              <th className="px-4 py-2">No. comprobante</th>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Medio de pago</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {comprobantes.map((c) => (
              <tr key={c.id} className="border-b border-washi-200 align-top">
                <td className="px-4 py-2 font-medium">{c.numero_comprobante}</td>
                <td className="px-4 py-2">
                  {new Date(c.fecha_emision).toLocaleDateString("es-CR")}
                </td>
                <td className="px-4 py-2 capitalize">{c.medio_pago}</td>
                <td className="px-4 py-2">{formatColon(Number(c.total_comprobante))}</td>
                <td className="px-4 py-2">
                  <Badge tono={ESTADO_TONO[c.estado as keyof typeof ESTADO_TONO] ?? "neutro"}>
                    {c.estado}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <FacturaAcciones facturaId={c.id} estado={c.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
