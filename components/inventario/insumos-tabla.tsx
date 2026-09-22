"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditIconButton } from "@/components/ui/edit-icon-button";
import { useToast } from "@/components/ui/toast";
import { formatColon } from "@/lib/utils";
import { actualizarStockMinimo } from "@/actions/inventario.actions";
import { clsx } from "clsx";

export type InsumoRow = {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario_promedio: number;
  unidad: string;
};

type NivelAlerta = "negativo" | "sin_stock" | "reabastecer" | "ok";

function nivelAlerta(stock: number, minimo: number): NivelAlerta {
  if (stock < 0) return "negativo";
  if (stock <= 0) return "sin_stock";
  if (minimo > 0 && stock <= minimo) return "reabastecer";
  return "ok";
}

function prioridad(nivel: NivelAlerta): number {
  if (nivel === "negativo") return 0;
  if (nivel === "sin_stock") return 1;
  if (nivel === "reabastecer") return 2;
  return 3;
}

export function InsumosTabla({ insumos }: { insumos: InsumoRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [minimoDraft, setMinimoDraft] = useState("");

  const ordenados = useMemo(() => {
    return [...insumos].sort((a, b) => {
      const pa = prioridad(nivelAlerta(Number(a.stock_actual), Number(a.stock_minimo)));
      const pb = prioridad(nivelAlerta(Number(b.stock_actual), Number(b.stock_minimo)));
      if (pa !== pb) return pa - pb;
      return a.nombre.localeCompare(b.nombre, "es");
    });
  }, [insumos]);

  const contadores = useMemo(() => {
    let negativos = 0;
    let sinStock = 0;
    let reabastecer = 0;
    for (const i of insumos) {
      const n = nivelAlerta(Number(i.stock_actual), Number(i.stock_minimo));
      if (n === "negativo") negativos += 1;
      else if (n === "sin_stock") sinStock += 1;
      else if (n === "reabastecer") reabastecer += 1;
    }
    return { negativos, sinStock, reabastecer, alertas: negativos + sinStock + reabastecer };
  }, [insumos]);

  function empezarEdicion(insumo: InsumoRow) {
    setEditandoId(insumo.id);
    setMinimoDraft(String(insumo.stock_minimo));
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setMinimoDraft("");
  }

  function guardarMinimo(insumoId: string) {
    const valor = Number(minimoDraft);
    if (!Number.isFinite(valor) || valor < 0) {
      toast("Stock mínimo inválido", "peligro");
      return;
    }
    startTransition(async () => {
      const result = await actualizarStockMinimo({ insumoId, stockMinimo: valor });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Stock mínimo actualizado", "exito");
      cancelarEdicion();
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {contadores.alertas > 0 ? (
        <div className="rounded-lg border border-vermillion/35 bg-vermillion/10 px-4 py-3 text-sm text-sumi-900">
          <p className="font-medium">
            {contadores.alertas}{" "}
            {contadores.alertas === 1 ? "insumo requiere atención" : "insumos requieren atención"}
          </p>
          <p className="mt-1 text-xs text-sumi-700">
            {[
              contadores.negativos > 0 ? `${contadores.negativos} en negativo` : null,
              contadores.sinStock > 0 ? `${contadores.sinStock} sin stock` : null,
              contadores.reabastecer > 0 ? `${contadores.reabastecer} por reabastecer` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            . Define un stock mínimo mayor a 0 para avisar antes de agotarse.
          </p>
        </div>
      ) : (
        <p className="text-sm text-sumi-700">
          Sin alertas de stock. Define mínimos mayores a 0 en cada insumo para avisos anticipados.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="isanami-table w-full text-sm">
          <thead className="text-left">
            <tr>
              <th className="px-4 py-2">Insumo</th>
              <th className="px-4 py-2">Stock actual</th>
              <th className="px-4 py-2">Stock mínimo</th>
              <th className="px-4 py-2">Costo promedio</th>
              <th className="px-4 py-2">Alerta</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {ordenados.map((insumo) => {
              const stock = Number(insumo.stock_actual);
              const minimo = Number(insumo.stock_minimo);
              const nivel = nivelAlerta(stock, minimo);
              const editando = editandoId === insumo.id;

              return (
                <tr
                  key={insumo.id}
                  className={clsx(
                    "border-b border-washi-200",
                    nivel === "negativo" && "bg-vermillion/10",
                    nivel === "sin_stock" && "bg-vermillion/5",
                    nivel === "reabastecer" && "bg-gold/10"
                  )}
                >
                  <td className="px-4 py-2 font-medium">{insumo.nombre}</td>
                  <td className="px-4 py-2 tabular-nums">
                    {stock} {insumo.unidad}
                  </td>
                  <td className="px-4 py-2">
                    {editando ? (
                      <Input
                        type="number"
                        min={0}
                        step="0.001"
                        value={minimoDraft}
                        onChange={(e) => setMinimoDraft(e.target.value)}
                        placeholder="Stock mínimo"
                        className="w-28"
                      />
                    ) : (
                      <span className="tabular-nums">
                        {minimo} {insumo.unidad}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 tabular-nums">
                    {formatColon(Number(insumo.costo_unitario_promedio ?? 0))}
                  </td>
                  <td className="px-4 py-2">
                    {nivel === "negativo" ? (
                      <Badge tono="peligro">Negativo</Badge>
                    ) : nivel === "sin_stock" ? (
                      <Badge tono="peligro">Sin stock</Badge>
                    ) : nivel === "reabastecer" ? (
                      <Badge tono="advertencia">Reabastecer</Badge>
                    ) : (
                      <span className="text-xs text-sumi-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editando ? (
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          className="h-8 px-2 text-xs"
                          disabled={pending}
                          onClick={() => guardarMinimo(insumo.id)}
                        >
                          Guardar
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-8 px-2 text-xs"
                          disabled={pending}
                          onClick={cancelarEdicion}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <EditIconButton
                        label={`Editar mínimo de ${insumo.nombre}`}
                        disabled={pending || editandoId !== null}
                        onClick={() => empezarEdicion(insumo)}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {ordenados.length === 0 ? (
          <p className="p-4 text-sm text-sumi-700">Todavía no hay insumos registrados.</p>
        ) : null}
      </div>
    </div>
  );
}
