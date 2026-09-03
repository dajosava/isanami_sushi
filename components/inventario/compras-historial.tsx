"use client";

import { IsanamiSection } from "@/components/ui/isanami-section";
import { formatColon } from "@/lib/utils";
import { one } from "@/lib/relations";

interface CompraRow {
  id: string;
  fecha: string;
  total: number;
  estado: string;
  proveedores: { nombre: string } | { nombre: string }[] | null;
}

export function ComprasHistorial({ compras }: { compras: CompraRow[] }) {
  return (
    <IsanamiSection
      title="Historial de compras"
      subtitle={compras.length > 0 ? `${compras.length} registros recientes` : "Sin compras registradas"}
      collapsible
      defaultOpen={false}
      bodyClassName="overflow-x-auto p-0"
    >
      <table className="isanami-table w-full text-sm">
        <thead className="text-left">
          <tr>
            <th className="px-4 py-2">Proveedor</th>
            <th className="px-4 py-2">Fecha</th>
            <th className="px-4 py-2">Total</th>
            <th className="px-4 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {compras.map((compra) => (
            <tr key={compra.id} className="border-b border-washi-200">
              <td className="px-4 py-2 font-medium">{one(compra.proveedores)?.nombre}</td>
              <td className="px-4 py-2">{new Date(compra.fecha).toLocaleDateString("es-CR")}</td>
              <td className="px-4 py-2">{formatColon(Number(compra.total))}</td>
              <td className="px-4 py-2 capitalize">{compra.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {compras.length === 0 && (
        <p className="p-4 text-sm text-sumi-700">Todavia no hay compras registradas.</p>
      )}
    </IsanamiSection>
  );
}
