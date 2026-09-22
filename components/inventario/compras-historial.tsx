"use client";

import { IsanamiSection } from "@/components/ui/isanami-section";
import { labelCategoriaGasto } from "@/lib/compras/categorias";
import { formatColon } from "@/lib/utils";
import { one } from "@/lib/relations";

interface CompraItemRow {
  cantidad: number;
  costo_unitario: number;
  insumos: { nombre: string } | { nombre: string }[] | null;
  unidades_medida:
    | { nombre: string; abreviatura: string }
    | { nombre: string; abreviatura: string }[]
    | null;
}

interface CompraRow {
  id: string;
  fecha: string;
  subtotal?: number | null;
  total_impuesto?: number | null;
  impuesto_iva_pct?: number | null;
  total: number;
  estado: string;
  categoria_gasto?: string | null;
  concepto?: string | null;
  numero_factura_proveedor?: string | null;
  proveedores: { nombre: string } | { nombre: string }[] | null;
  compras_items?: CompraItemRow[] | null;
}

export function ComprasHistorial({ compras }: { compras: CompraRow[] }) {
  return (
    <IsanamiSection
      title="Historial de compras y gastos"
      subtitle={
        compras.length > 0
          ? `${compras.length} registros recientes`
          : "Sin facturas registradas"
      }
      collapsible
      defaultOpen={false}
      bodyClassName="overflow-x-auto p-0"
    >
      <table className="isanami-table w-full text-sm">
        <thead className="text-left">
          <tr>
            <th className="px-4 py-2">Proveedor / factura</th>
            <th className="px-4 py-2">Categoría</th>
            <th className="px-4 py-2">Detalle</th>
            <th className="px-4 py-2">Fecha</th>
            <th className="px-4 py-2">Montos</th>
            <th className="px-4 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {compras.map((compra) => {
            const items = compra.compras_items ?? [];
            const subtotal = Number(compra.subtotal ?? compra.total);
            const impuesto = Number(compra.total_impuesto ?? 0);
            const ivaPct = Number(compra.impuesto_iva_pct ?? 0);
            return (
              <tr key={compra.id} className="border-b border-washi-200 align-top">
                <td className="px-4 py-2 font-medium">
                  {one(compra.proveedores)?.nombre}
                  {compra.numero_factura_proveedor ? (
                    <span className="mt-0.5 block text-xs font-normal text-sumi-600">
                      Factura {compra.numero_factura_proveedor}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2">
                  {labelCategoriaGasto(compra.categoria_gasto ?? "mercaderia")}
                </td>
                <td className="px-4 py-2">
                  {compra.concepto ? (
                    <p className="mb-1 text-sumi-800">{compra.concepto}</p>
                  ) : null}
                  {items.length === 0 ? (
                    !compra.concepto ? (
                      <span className="text-sumi-600">—</span>
                    ) : null
                  ) : (
                    <ul className="space-y-1">
                      {items.map((it, idx) => {
                        const unidad = one(it.unidades_medida);
                        return (
                          <li key={idx}>
                            <span className="font-medium">{one(it.insumos)?.nombre}</span>
                            <span className="text-sumi-700">
                              {" "}
                              · {it.cantidad}{" "}
                              {unidad?.abreviatura ?? unidad?.nombre ?? ""}
                            </span>
                            <span className="block text-xs text-sumi-600">
                              {formatColon(Number(it.costo_unitario))} / unidad
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {new Date(compra.fecha).toLocaleDateString("es-CR")}
                </td>
                <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                  <span className="block font-medium">
                    {formatColon(Number(compra.total))}
                  </span>
                  <span className="block text-xs text-sumi-600">
                    Sub {formatColon(subtotal)}
                    {impuesto > 0 || ivaPct > 0
                      ? ` · IVA ${ivaPct}% ${formatColon(impuesto)}`
                      : " · sin IVA"}
                  </span>
                </td>
                <td className="px-4 py-2 capitalize">{compra.estado}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {compras.length === 0 && (
        <p className="p-4 text-sm text-sumi-700">Todavía no hay facturas registradas.</p>
      )}
    </IsanamiSection>
  );
}
