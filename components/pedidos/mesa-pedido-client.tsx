"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatColon } from "@/lib/utils";
import { LoadingOverlay } from "@/components/ui/page-loader";
import { crearPedido, agregarItemsAPedido, enviarPedidoACocina, anularPedido, eliminarItemPedido } from "@/actions/pedidos.actions";

export interface ProductoMenu {
  id: string;
  nombre: string;
  precio_venta: number;
  descripcion?: string | null;
}

export interface CategoriaMenu {
  id: string;
  nombre: string;
  productos: ProductoMenu[];
}

export interface PedidoItemActivo {
  id: string;
  cantidad: number;
  notas: string | null;
  estado_cocina: string;
  productos: { nombre: string; precio_venta: number } | null;
}

export interface PedidoActivo {
  id: string;
  estado: string;
  pedido_items: PedidoItemActivo[] | null;
}

interface CartLine {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  notas: string;
}

export function MesaPedidoClient({
  mesaId,
  mesaNumero,
  tipo = "salon",
  titulo,
  mensajeVacio,
  volverHref = "/pedidos",
  categorias,
  pedidoActivo,
}: {
  mesaId?: string;
  mesaNumero?: number | null;
  tipo?: "salon" | "para_llevar";
  titulo?: string;
  mensajeVacio?: string;
  volverHref?: string;
  categorias: CategoriaMenu[];
  pedidoActivo: PedidoActivo | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pending, startTransition] = useTransition();
  const [categoriaActiva, setCategoriaActiva] = useState(categorias[0]?.id ?? "");

  const cartTotal = useMemo(
    () => cart.reduce((acc, line) => acc + line.precio * line.cantidad, 0),
    [cart]
  );

  function addProducto(producto: ProductoMenu) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productoId === producto.id);
      if (existing) {
        return prev.map((l) =>
          l.productoId === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l
        );
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          precio: Number(producto.precio_venta),
          cantidad: 1,
          notas: "",
        },
      ];
    });
  }

  function updateCantidad(productoId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productoId === productoId ? { ...l, cantidad: l.cantidad + delta } : l
        )
        .filter((l) => l.cantidad > 0)
    );
  }

  function updateNotas(productoId: string, notas: string) {
    setCart((prev) => prev.map((l) => (l.productoId === productoId ? { ...l, notas } : l)));
  }

  const encabezado = titulo ?? (mesaNumero != null ? `Mesa ${mesaNumero}` : "Pedido");
  const textoVacio =
    mensajeVacio ??
    (tipo === "para_llevar"
      ? "Todavia no hay productos en este pedido para llevar."
      : "Todavia no hay pedido abierto en esta mesa.");

  function confirmarCarrito() {
    if (cart.length === 0) {
      toast("Agrega al menos un producto", "peligro");
      return;
    }

    const items = cart.map((l) => ({
      productoId: l.productoId,
      cantidad: l.cantidad,
      notas: l.notas || undefined,
    }));

    startTransition(async () => {
      const result = pedidoActivo
        ? await agregarItemsAPedido({ pedidoId: pedidoActivo.id, items })
        : await crearPedido({
            mesaId: tipo === "salon" ? mesaId : null,
            tipo,
            items,
          });

      if (!result.ok) {
        const msg =
          typeof result.error === "string"
            ? result.error
            : "No se pudo guardar el pedido";
        toast(msg, "peligro");
        return;
      }

      setCart([]);
      toast(pedidoActivo ? "Items agregados" : "Pedido creado", "exito");

      if (!pedidoActivo && tipo === "para_llevar" && "pedidoId" in result && result.pedidoId) {
        router.push(`/pedidos/para-llevar/${result.pedidoId}`);
        return;
      }

      router.refresh();
    });
  }

  function enviarACocina() {
    if (!pedidoActivo) return;
    startTransition(async () => {
      const result = await enviarPedidoACocina(pedidoActivo.id);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Pedido enviado a cocina", "exito");
      router.refresh();
    });
  }

  function deshacerPedido() {
    if (!pedidoActivo) return;
    const ok = window.confirm(
      tipo === "para_llevar"
        ? "¿Anular este pedido para llevar? Se quitan las comandas de cocina."
        : "¿Anular este pedido? Se libera la mesa y se quitan las comandas de cocina."
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await anularPedido(pedidoActivo.id);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      setCart([]);
      toast("Pedido anulado", "exito");
      if (tipo === "para_llevar") {
        router.push("/pedidos");
        return;
      }
      router.refresh();
    });
  }

  function quitarItem(itemId: string) {
    startTransition(async () => {
      const result = await eliminarItemPedido(itemId);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Item quitado", "exito");
      router.refresh();
    });
  }

  const puedeCobrar =
    pedidoActivo &&
    ["enviado", "en_preparacion", "servido"].includes(pedidoActivo.estado);

  const categoriaSeleccionada =
    categorias.find((c) => c.id === categoriaActiva) ?? categorias[0] ?? null;

  return (
    <>
      {pending ? <LoadingOverlay label="Procesando pedido..." /> : null}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link
          href={volverHref}
          className="text-sm text-washi-50/80 underline-offset-2 hover:text-washi-50 hover:underline"
        >
          ← Volver
        </Link>
        <h1 className="font-display text-xl text-washi-50 sm:text-2xl">{encabezado}</h1>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 pb-32 lg:grid-cols-3 lg:gap-6 lg:pb-0">
      <div className="order-2 min-w-0 space-y-4 lg:order-1 lg:col-span-2">
        {categorias.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Menú</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="isanami-category-scroll mb-4 flex flex-nowrap gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible md:pb-0"
                role="tablist"
                aria-label="Categorías del menú"
              >
                {categorias.map((categoria) => (
                  <button
                    key={categoria.id}
                    type="button"
                    role="tab"
                    aria-selected={categoriaSeleccionada?.id === categoria.id}
                    onClick={() => setCategoriaActiva(categoria.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                      categoriaSeleccionada?.id === categoria.id
                        ? "bg-[#FF4D3A] text-white shadow-[0_4px_14px_rgba(255,77,58,0.35)]"
                        : "isanami-light-chip border border-sakura-300/50 bg-washi-50 text-sumi-800 hover:border-sakura-400 hover:bg-white"
                    }`}
                  >
                    {categoria.nombre}
                  </button>
                ))}
              </div>

              {categoriaSeleccionada ? (
                <div>
                  <h2 className="mb-2 text-base font-semibold text-sumi-900">
                    {categoriaSeleccionada.nombre}
                  </h2>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {categoriaSeleccionada.productos.map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        onClick={() => addProducto(producto)}
                        className="rounded-md border border-sakura-200 bg-white/95 px-2.5 py-2 text-left transition hover:border-sakura-400 hover:bg-sakura-50/40"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="min-w-0 flex-1 truncate text-sm font-medium leading-tight text-sumi-900">
                            {producto.nombre}
                          </span>
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-sakura-600">
                            {formatColon(Number(producto.precio_venta))}
                          </span>
                        </div>
                        {producto.descripcion ? (
                          <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-sumi-600">
                            {producto.descripcion}
                          </p>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-sumi-700">Selecciona una categoría.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-sumi-700">
                No hay productos activos en el menú. Carga el menú oficial en Supabase o agrégalos
                en Admin → Menú.
              </p>
            </CardContent>
          </Card>
        )}

        {cart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Carrito ({cart.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="mb-3 space-y-2">
                {cart.map((line) => (
                  <li key={line.productoId} className="border-b border-washi-200 pb-2 last:border-0">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-medium text-sumi-900">
                        {line.nombre}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-sumi-800">
                        {formatColon(line.precio * line.cantidad)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        className="isanami-touch-target shrink-0 px-3 py-2"
                        onClick={() => updateCantidad(line.productoId, -1)}
                      >
                        -
                      </Button>
                      <span className="w-6 shrink-0 text-center text-sm text-sumi-900">
                        {line.cantidad}
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        className="isanami-touch-target shrink-0 px-3 py-2"
                        onClick={() => updateCantidad(line.productoId, 1)}
                      >
                        +
                      </Button>
                      <Input
                        className="min-w-0 flex-1 py-1.5 text-xs"
                        placeholder="Notas..."
                        value={line.notas}
                        onChange={(e) => updateNotas(line.productoId, e.target.value)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mb-3 flex justify-between text-sm font-medium text-sumi-900">
                <span>Subtotal carrito</span>
                <span>{formatColon(cartTotal)}</span>
              </div>
              <Button className="w-full" disabled={pending} onClick={confirmarCarrito}>
                {pedidoActivo ? "Agregar al pedido" : "Crear pedido"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="order-1 h-fit lg:order-2">
        <CardHeader>
          <CardTitle>Cuenta actual</CardTitle>
        </CardHeader>
        <CardContent>
          {pedidoActivo ? (
            <>
              <p className="mb-3 text-xs uppercase tracking-wide text-sumi-700">
                Estado: {pedidoActivo.estado}
              </p>
              <ul className="mb-4 space-y-2 text-sm text-sumi-900">
                {(pedidoActivo.pedido_items ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-2 border-b border-washi-200 pb-1"
                  >
                    <span>
                      {item.cantidad}x {item.productos?.nombre}
                      {item.notas ? (
                        <span className="block text-xs text-sumi-700">{item.notas}</span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sumi-700">{item.estado_cocina}</span>
                      {["pendiente", "en_preparacion"].includes(item.estado_cocina) && (
                        <button
                          type="button"
                          className="text-xs text-umeboshi-500 underline disabled:opacity-50"
                          disabled={pending}
                          onClick={() => quitarItem(item.id)}
                        >
                          Quitar
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="hidden flex-col gap-2 lg:flex">
                {(pedidoActivo.estado === "abierto" ||
                  (pedidoActivo.pedido_items ?? []).some(
                    (i) => i.estado_cocina === "pendiente"
                  )) && (
                  <Button disabled={pending} onClick={enviarACocina}>
                    Enviar a cocina
                  </Button>
                )}
                {puedeCobrar && (
                  <Link
                    href={`/facturacion/nueva/${pedidoActivo.id}`}
                    className="inline-flex items-center justify-center rounded-md bg-wasabi-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Cobrar
                  </Link>
                )}
                <Button variant="danger" disabled={pending} onClick={deshacerPedido}>
                  Anular pedido
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-sumi-700">{textoVacio}</p>
          )}
        </CardContent>
      </Card>
    </div>

      {pedidoActivo ? (
        <div className="isanami-mobile-dock fixed inset-x-0 bottom-0 z-30 border-t border-sakura-600/30 bg-isanami-sakura/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md lg:hidden">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-washi-50/90">
            Cuenta · {pedidoActivo.estado}
          </p>
          <div className="flex flex-wrap gap-2">
            {(pedidoActivo.estado === "abierto" ||
              (pedidoActivo.pedido_items ?? []).some((i) => i.estado_cocina === "pendiente")) && (
              <Button disabled={pending} onClick={enviarACocina} className="min-h-11 flex-1">
                Enviar a cocina
              </Button>
            )}
            {puedeCobrar && (
              <Link
                href={`/facturacion/nueva/${pedidoActivo.id}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-wasabi-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Cobrar
              </Link>
            )}
            <Button
              variant="danger"
              disabled={pending}
              onClick={deshacerPedido}
              className="min-h-11 w-full sm:w-auto"
            >
              Anular
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
