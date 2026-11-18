"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { guardarRecetaLineas } from "@/actions/admin.actions";

interface Option {
  id: string;
  nombre: string;
}

export type RecetaLineaExistente = {
  insumoId: string;
  cantidad: number;
  unidadId: string;
};

export type ProductoConReceta = Option & {
  recetas: RecetaLineaExistente[];
};

type LineaReceta = {
  key: string;
  insumoId: string;
  cantidad: string;
  unidadId: string;
};

function claveLinea() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nuevaLinea(unidades: Option[]): LineaReceta {
  return {
    key: claveLinea(),
    insumoId: "",
    cantidad: "",
    unidadId: unidades[0]?.id ?? "",
  };
}

function lineasDesdeReceta(
  recetas: RecetaLineaExistente[],
  unidades: Option[]
): LineaReceta[] {
  if (!recetas.length) return [nuevaLinea(unidades)];
  return recetas.map((r) => ({
    key: claveLinea(),
    insumoId: r.insumoId,
    cantidad: String(r.cantidad),
    unidadId: r.unidadId || unidades[0]?.id || "",
  }));
}

export function RecetaForm({
  productos,
  insumos,
  unidades,
  productoInicialId,
}: {
  productos: ProductoConReceta[];
  insumos: Option[];
  unidades: Option[];
  /** Si se pasa (p. ej. al hacer clic en una tarjeta), carga esa receta. */
  productoInicialId?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const inicial = productoInicialId
    ? productos.find((p) => p.id === productoInicialId)
    : null;

  const [productoId, setProductoId] = useState(inicial?.id ?? "");
  const [lineas, setLineas] = useState<LineaReceta[]>(() =>
    inicial ? lineasDesdeReceta(inicial.recetas, unidades) : [nuevaLinea(unidades)]
  );

  const productoActual = productos.find((p) => p.id === productoId) ?? null;
  const editandoExistente = (productoActual?.recetas.length ?? 0) > 0;

  function seleccionarProducto(id: string) {
    setProductoId(id);
    const producto = productos.find((p) => p.id === id);
    setLineas(lineasDesdeReceta(producto?.recetas ?? [], unidades));
  }

  function actualizarLinea(key: string, patch: Partial<LineaReceta>) {
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, nuevaLinea(unidades)]);
  }

  function quitarLinea(key: string) {
    setLineas((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productoId) {
      toast("Selecciona un producto del menú", "peligro");
      return;
    }

    const preparadas = lineas
      .map((l) => ({
        insumo_id: l.insumoId,
        cantidad_requerida: Number(l.cantidad),
        unidad_medida_id: l.unidadId,
      }))
      .filter((l) => l.insumo_id);

    if (preparadas.length === 0) {
      toast("Agrega al menos un ingrediente", "peligro");
      return;
    }

    for (const l of preparadas) {
      if (!(l.cantidad_requerida > 0) || !l.unidad_medida_id) {
        toast("Completa cantidad y unidad en cada línea", "peligro");
        return;
      }
    }

    startTransition(async () => {
      const result = await guardarRecetaLineas({
        producto_id: productoId,
        lineas: preparadas,
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast(
        editandoExistente
          ? `Receta actualizada (${result.guardadas} ingrediente(s))`
          : `${result.guardadas} ingrediente(s) guardados`,
        "exito"
      );
      router.refresh();
    });
  }

  return (
    <Card className="mb-6" id="armar-receta">
      <CardHeader>
        <CardTitle>
          {editandoExistente ? "Editar receta" : "Armar receta (varios ingredientes)"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="max-w-md space-y-1">
            <label className="block text-sm font-medium text-sumi-800">Producto del menú</label>
            <Select
              value={productoId}
              onChange={(e) => seleccionarProducto(e.target.value)}
              required
              aria-label="Producto del menú"
            >
              <option value="" disabled>
                Selecciona un producto
              </option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                  {p.recetas.length > 0 ? " (con receta)" : ""}
                </option>
              ))}
            </Select>
            {editandoExistente ? (
              <p className="text-xs text-sumi-600">
                Este plato ya tiene receta: los ingredientes se cargaron abajo. Puedes
                modificar cantidades, cambiar insumos, agregar o quitar líneas y guardar.
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-sumi-800">Ingredientes</p>
            {lineas.map((linea, idx) => (
              <div
                key={linea.key}
                className="grid gap-2 rounded-md border border-washi-200 bg-washi-50/40 p-3 sm:grid-cols-[1fr_7rem_9rem_auto]"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-sumi-700">
                    Insumo {idx + 1}
                  </label>
                  <Select
                    value={linea.insumoId}
                    onChange={(e) => actualizarLinea(linea.key, { insumoId: e.target.value })}
                    required={idx === 0}
                    aria-label={`Insumo ${idx + 1}`}
                  >
                    <option value="" disabled>
                      Selecciona un insumo
                    </option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-sumi-700">Cantidad</label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="Ej. 0.050"
                    value={linea.cantidad}
                    onChange={(e) => actualizarLinea(linea.key, { cantidad: e.target.value })}
                    required
                    aria-label={`Cantidad ${idx + 1}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-sumi-700">Unidad</label>
                  <Select
                    value={linea.unidadId}
                    onChange={(e) => actualizarLinea(linea.key, { unidadId: e.target.value })}
                    required
                    aria-label={`Unidad ${idx + 1}`}
                  >
                    <option value="" disabled>
                      Unidad
                    </option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md text-umeboshi-500 transition hover:bg-umeboshi-500/10 disabled:opacity-40"
                    onClick={() => quitarLinea(linea.key)}
                    disabled={lineas.length <= 1 || pending}
                    aria-label={`Quitar ingrediente ${idx + 1}`}
                    title="Quitar línea"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={agregarLinea}
              disabled={pending || insumos.length === 0}
            >
              <Plus size={16} className="mr-1.5" />
              Agregar ingrediente
            </Button>
            <Button type="submit" disabled={pending || !productoId || insumos.length === 0}>
              {editandoExistente ? "Guardar cambios" : "Guardar receta"}
            </Button>
          </div>

          {insumos.length === 0 ? (
            <p className="text-sm text-sumi-700">
              Aún no hay insumos. Créalos en Inventario → Insumos o al registrar una compra.
            </p>
          ) : (
            <p className="text-xs text-sumi-600">
              Al guardar se reemplaza toda la receta del plato con las líneas que veas aquí.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
