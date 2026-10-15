"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EditIconButton } from "@/components/ui/edit-icon-button";
import { useToast } from "@/components/ui/toast";
import { formatColon } from "@/lib/utils";
import {
  actualizarStockInsumo,
  eliminarInsumo,
} from "@/actions/inventario.actions";
import { clsx } from "clsx";

export type InsumoRow = {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario_promedio: number;
  unidad: string;
  unidad_medida_id: string;
};

export type UnidadMedidaOpcion = {
  id: string;
  nombre: string;
  abreviatura: string;
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

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function InsumosTabla({
  insumos,
  unidades,
}: {
  insumos: InsumoRow[];
  unidades: UnidadMedidaOpcion[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [stockDraft, setStockDraft] = useState("");
  const [minimoDraft, setMinimoDraft] = useState("");
  const [unidadDraft, setUnidadDraft] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const ordenados = useMemo(() => {
    const termino = normalizar(busqueda);
    return insumos
      .filter((i) => termino === "" || normalizar(i.nombre).includes(termino))
      .sort((a, b) => {
        const pa = prioridad(
          nivelAlerta(Number(a.stock_actual), Number(a.stock_minimo)),
        );
        const pb = prioridad(
          nivelAlerta(Number(b.stock_actual), Number(b.stock_minimo)),
        );
        if (pa !== pb) return pa - pb;
        return a.nombre.localeCompare(b.nombre, "es");
      });
  }, [insumos, busqueda]);

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
    return {
      negativos,
      sinStock,
      reabastecer,
      alertas: negativos + sinStock + reabastecer,
    };
  }, [insumos]);

  function empezarEdicion(insumo: InsumoRow) {
    setEditandoId(insumo.id);
    setStockDraft(String(insumo.stock_actual));
    setMinimoDraft(String(insumo.stock_minimo));
    setUnidadDraft(insumo.unidad_medida_id);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setStockDraft("");
    setMinimoDraft("");
    setUnidadDraft("");
  }

  function guardarEdicion(insumo: InsumoRow) {
    const stock = Number(stockDraft);
    const minimo = Number(minimoDraft);
    if (stockDraft.trim() === "" || !Number.isFinite(stock) || stock < 0) {
      toast("Stock actual inválido", "peligro");
      return;
    }
    if (minimoDraft.trim() === "" || !Number.isFinite(minimo) || minimo < 0) {
      toast("Stock mínimo inválido", "peligro");
      return;
    }

    if (!unidadDraft) {
      toast("Selecciona una unidad de medida", "peligro");
      return;
    }

    const unidadNueva = unidades.find((u) => u.id === unidadDraft);
    const abreviaturaNueva = unidadNueva?.abreviatura ?? insumo.unidad;
    const cambios: string[] = [];

    if (unidadDraft !== insumo.unidad_medida_id) {
      cambios.push(
        `La unidad pasará de "${insumo.unidad || "sin unidad"}" a "${abreviaturaNueva}". Revisa que las recetas y el stock sigan teniendo sentido con la nueva unidad.`,
      );
    }

    const diferencia = stock - Number(insumo.stock_actual);
    if (diferencia !== 0) {
      cambios.push(
        `El stock pasará de ${insumo.stock_actual} a ${stock} ${abreviaturaNueva} (${
          diferencia > 0 ? "+" : ""
        }${Number(diferencia.toFixed(3))}).`,
      );
    }

    if (
      cambios.length > 0 &&
      !window.confirm(`"${insumo.nombre}":\n\n${cambios.join("\n\n")}\n\n¿Confirmar cambios?`)
    ) {
      return;
    }

    startTransition(async () => {
      const result = await actualizarStockInsumo({
        insumoId: insumo.id,
        stockActual: stock,
        stockMinimo: minimo,
        unidadMedidaId: unidadDraft,
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Insumo actualizado", "exito");
      cancelarEdicion();
      router.refresh();
    });
  }

  function eliminar(insumo: InsumoRow) {
    if (
      !window.confirm(
        `¿Eliminar "${insumo.nombre}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await eliminarInsumo(insumo.id);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Insumo eliminado", "exito");
      if (editandoId === insumo.id) cancelarEdicion();
      router.refresh();
    });
  }

  return (
    <Card className="overflow-x-auto">
      <CardHeader className="flex-wrap">
        <CardTitle>Listado de insumos</CardTitle>
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/45"
            aria-hidden
          />
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar insumo..."
            aria-label="Buscar insumo"
            className="!pl-10 !pr-9 [&::-webkit-search-cancel-button]:hidden"
          />
          {busqueda ? (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-ink/60 transition hover:bg-ink/10 hover:text-ink"
              aria-label="Limpiar búsqueda"
              title="Limpiar búsqueda"
            >
              <X size={14} aria-hidden />
            </button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {contadores.alertas > 0 ? (
          <div className="rounded-lg border border-vermillion/35 bg-vermillion/10 px-4 py-3 text-sm text-sumi-900">
            <p className="font-medium">
              {contadores.alertas}{" "}
              {contadores.alertas === 1
                ? "insumo requiere atención"
                : "insumos requieren atención"}
            </p>
            <p className="mt-1 text-xs text-sumi-700">
              {[
                contadores.negativos > 0
                  ? `${contadores.negativos} en negativo`
                  : null,
                contadores.sinStock > 0
                  ? `${contadores.sinStock} sin stock`
                  : null,
                contadores.reabastecer > 0
                  ? `${contadores.reabastecer} por reabastecer`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              . Define un stock mínimo mayor a 0 para avisar antes de agotarse.
            </p>
          </div>
        ) : (
          <p className="text-sm text-sumi-700">
            Sin alertas de stock. Define mínimos mayores a 0 en cada insumo para
            avisos anticipados.
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="isanami-table w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-2">Insumo</th>
                <th className="px-4 py-2">Unidad</th>
                <th className="px-4 py-2">Stock actual</th>
                <th className="px-4 py-2">Stock mínimo</th>
                <th className="px-4 py-2">Costo promedio</th>
                <th className="px-4 py-2">Alerta</th>
                <th className="px-4 py-2">Acciones</th>
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
                      nivel === "reabastecer" && "bg-gold/10",
                    )}
                  >
                    <td className="px-4 py-2 font-medium">{insumo.nombre}</td>
                    <td className="px-4 py-2">
                      {editando ? (
                        <Select
                          value={unidadDraft}
                          onChange={(e) => setUnidadDraft(e.target.value)}
                          aria-label={`Unidad de ${insumo.nombre}`}
                          className="w-36"
                        >
                          <option value="" disabled>
                            Selecciona unidad
                          </option>
                          {unidades.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nombre} ({u.abreviatura})
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <span className="text-sumi-700">{insumo.unidad || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {editando ? (
                        <Input
                          type="number"
                          min={0}
                          step="0.001"
                          value={stockDraft}
                          onChange={(e) => setStockDraft(e.target.value)}
                          placeholder="Stock actual"
                          className="w-28"
                          autoFocus
                        />
                      ) : (
                        <>
                          {stock} {insumo.unidad}
                        </>
                      )}
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
                            onClick={() => guardarEdicion(insumo)}
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
                        <div className="flex flex-wrap items-center gap-1">
                          <EditIconButton
                            label={`Editar ${insumo.nombre}`}
                            disabled={pending || editandoId !== null}
                            onClick={() => empezarEdicion(insumo)}
                          />
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-umeboshi-500 transition hover:bg-umeboshi-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={pending}
                            onClick={() => eliminar(insumo)}
                            title="Eliminar insumo"
                            aria-label={`Eliminar ${insumo.nombre}`}
                          >
                            <Trash2 size={15} strokeWidth={2} aria-hidden />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {ordenados.length === 0 ? (
            <p className="p-4 text-sm text-sumi-700">
              {insumos.length === 0
                ? "Todavía no hay insumos registrados."
                : `No hay insumos que coincidan con "${busqueda.trim()}".`}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
