"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Trash2 } from "lucide-react";
import { EditIconButton } from "@/components/ui/edit-icon-button";
import { clsx } from "clsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { crearCategoria, eliminarCategoria, eliminarProducto, guardarProducto } from "@/actions/admin.actions";
import { formatColon } from "@/lib/utils";

interface Categoria {
  id: string;
  nombre: string;
}

interface ProductoRow {
  id: string;
  nombre: string;
  precio_venta: number;
  activo: boolean;
  tipo: string;
  categoria_id: string | null;
  categorias_menu: { nombre: string } | null;
}

export function MenuAdminClient({
  productos,
  categorias,
}: {
  productos: ProductoRow[];
  categorias: Categoria[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [tipo, setTipo] = useState<"plato" | "bebida" | "combo">("plato");
  const [nuevaCat, setNuevaCat] = useState("");
  const [categoriasAbiertas, setCategoriasAbiertas] = useState<Set<string>>(new Set());
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPrecio, setEditPrecio] = useState("");

  function toggleCategoria(categoriaId: string) {
    setCategoriasAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(categoriaId)) next.delete(categoriaId);
      else next.add(categoriaId);
      return next;
    });
  }

  function renderTablaProductos(items: ProductoRow[]) {
    return (
      <table className="isanami-table w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2">Producto</th>
            <th className="px-4 py-2">Precio</th>
            <th className="px-4 py-2">Activo</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const editando = editandoId === p.id;

            return (
              <tr key={p.id}>
                <td className="px-4 py-2 font-medium">
                  {editando ? (
                    <Input
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      required
                      className="min-w-[10rem]"
                    />
                  ) : (
                    p.nombre
                  )}
                </td>
                <td className="px-4 py-2">
                  {editando ? (
                    <Input
                      type="number"
                      min={0}
                      value={editPrecio}
                      onChange={(e) => setEditPrecio(e.target.value)}
                      required
                      className="w-28"
                    />
                  ) : (
                    formatColon(Number(p.precio_venta))
                  )}
                </td>
                <td className="px-4 py-2">{p.activo ? "Si" : "No"}</td>
                <td className="px-4 py-2">{renderAcciones(p, editando)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  function renderPanelColapsable(panelId: string, titulo: string, children: React.ReactNode) {
    const abierta = categoriasAbiertas.has(panelId);

    return (
      <div key={panelId} className="isanami-panel overflow-hidden">
        <button
          type="button"
          onClick={() => toggleCategoria(panelId)}
          className="isanami-panel-header flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={abierta}
        >
          <h2 className="font-display text-lg font-semibold text-washi-50">{titulo}</h2>
          <ChevronDown
            size={18}
            className={clsx("shrink-0 text-washi-50/80 transition-transform", abierta && "rotate-180")}
          />
        </button>
        {abierta && <div className="isanami-panel-body p-4">{children}</div>}
      </div>
    );
  }

  function renderCategoriaColapsable(
    categoriaId: string,
    titulo: string,
    items: ProductoRow[],
    puedeEliminar = false
  ) {
    const abierta = categoriasAbiertas.has(categoriaId);

    return (
      <div key={categoriaId} className="isanami-panel overflow-hidden">
        <div className="isanami-panel-header flex items-center">
          <button
            type="button"
            onClick={() => toggleCategoria(categoriaId)}
            className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left"
            aria-expanded={abierta}
          >
            <div>
              <h2 className="font-display text-lg font-semibold text-washi-50">{titulo}</h2>
              <p className="text-xs text-washi-50/90">{items.length} productos</p>
            </div>
            <ChevronDown
              size={18}
              className={clsx("shrink-0 text-washi-50/80 transition-transform", abierta && "rotate-180")}
            />
          </button>
          {puedeEliminar && (
            <button
              type="button"
              className="mr-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-washi-50 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={pending}
              onClick={() => onDeleteCategoria(categoriaId, titulo)}
              aria-label={`Eliminar categoria ${titulo}`}
              title="Eliminar categoria"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
        {abierta && (
          <div className="isanami-panel-body overflow-x-auto">
            {items.length > 0 ? (
              renderTablaProductos(items)
            ) : (
              <p className="px-4 py-3 text-sm text-sumi-600">No hay productos en esta categoria.</p>
            )}
          </div>
        )}
      </div>
    );
  }

  function onCreateProducto(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await guardarProducto({
        nombre,
        precio_venta: Number(precio),
        categoria_id: categoriaId || null,
        tipo,
        activo: true,
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Producto guardado", "exito");
      setNombre("");
      setPrecio("");
      router.refresh();
    });
  }

  function onStartEdit(p: ProductoRow) {
    setEditandoId(p.id);
    setEditNombre(p.nombre);
    setEditPrecio(String(p.precio_venta));
  }

  function onCancelEdit() {
    setEditandoId(null);
    setEditNombre("");
    setEditPrecio("");
  }

  function onSaveEdit(p: ProductoRow) {
    if (!editNombre.trim()) {
      toast("El nombre es obligatorio", "peligro");
      return;
    }

    const precio = Number(editPrecio);
    if (Number.isNaN(precio) || precio < 0) {
      toast("Precio invalido", "peligro");
      return;
    }

    startTransition(async () => {
      const result = await guardarProducto({
        id: p.id,
        nombre: editNombre.trim(),
        precio_venta: precio,
        categoria_id: p.categoria_id,
        tipo: (p.tipo as "plato" | "bebida" | "combo") || "plato",
        activo: p.activo,
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Producto actualizado", "exito");
      onCancelEdit();
      router.refresh();
    });
  }

  function onToggleActivo(p: ProductoRow) {
    startTransition(async () => {
      const result = await guardarProducto({
        id: p.id,
        nombre: p.nombre,
        precio_venta: Number(p.precio_venta),
        categoria_id: p.categoria_id,
        tipo: (p.tipo as "plato" | "bebida" | "combo") || "plato",
        activo: !p.activo,
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Producto actualizado", "exito");
      router.refresh();
    });
  }

  function onCreateCategoria(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await crearCategoria(nuevaCat);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Categoria creada", "exito");
      setNuevaCat("");
      router.refresh();
    });
  }

  function onDeleteCategoria(categoriaId: string, nombre: string) {
    const ok = window.confirm(`¿Eliminar la categoria "${nombre}"?`);
    if (!ok) return;

    startTransition(async () => {
      const result = await eliminarCategoria(categoriaId);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Categoria eliminada", "exito");
      router.refresh();
    });
  }

  function onDelete(p: ProductoRow) {
    const ok = window.confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`);
    if (!ok) return;

    startTransition(async () => {
      const result = await eliminarProducto(p.id);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Producto eliminado", "exito");
      router.refresh();
    });
  }

  function renderAcciones(p: ProductoRow, editando: boolean) {
    if (editando) {
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="primary" disabled={pending} onClick={() => onSaveEdit(p)}>
            Guardar
          </Button>
          <Button variant="secondary" disabled={pending} onClick={onCancelEdit}>
            Cancelar
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <EditIconButton
          disabled={pending || editandoId !== null}
          onClick={() => onStartEdit(p)}
          label={`Editar ${p.nombre}`}
        />
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-md border border-sakura-200 bg-sakura-100/80 px-2 text-xs font-medium text-sumi-900 transition hover:bg-sakura-200/80 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={pending || editandoId !== null}
          onClick={() => onToggleActivo(p)}
          title={p.activo ? "Desactivar producto" : "Activar producto"}
        >
          {p.activo ? "Desactivar" : "Activar"}
        </button>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-umeboshi-500 transition hover:bg-umeboshi-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={pending || editandoId !== null}
          onClick={() => onDelete(p)}
          aria-label={`Eliminar ${p.nombre}`}
          title="Eliminar producto"
        >
          <Trash2 size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {renderPanelColapsable(
          "nuevo-producto",
          "Nuevo producto",
          <form onSubmit={onCreateProducto} className="space-y-3">
            <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            <Input
              type="number"
              placeholder="Precio"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              required
              min={0}
            />
            <Select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Sin categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
              <option value="plato">Plato</option>
              <option value="bebida">Bebida</option>
              <option value="combo">Combo</option>
            </Select>
            <Button type="submit" disabled={pending} className="w-full">
              Guardar producto
            </Button>
          </form>
        )}

        {renderPanelColapsable(
          "nueva-categoria",
          "Nueva categoria",
          <form onSubmit={onCreateCategoria} className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Nombre categoria"
              value={nuevaCat}
              onChange={(e) => setNuevaCat(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={pending} className="sm:shrink-0">
              Agregar
            </Button>
          </form>
        )}
      </div>

      {categorias.map((categoria) => {
          const items = productos.filter((p) => p.categoria_id === categoria.id);
          return renderCategoriaColapsable(categoria.id, categoria.nombre, items, true);
        })}

        {productos.filter((p) => !p.categoria_id).length > 0
          ? renderCategoriaColapsable(
              "sin-categoria",
              "Sin categoría",
              productos.filter((p) => !p.categoria_id)
            )
          : null}
    </div>
  );
}
