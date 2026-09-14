"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatColon } from "@/lib/utils";
import { LoadingOverlay } from "@/components/ui/page-loader";
import { useNavigationLoading } from "@/components/providers/navigation-progress";
import { crearComprobante, crearComprobanteConPagos } from "@/actions/facturacion.actions";
import { montoServicio } from "@/lib/facturacion/calcular-cuenta";

type MedioPago = "efectivo" | "tarjeta" | "sinpe" | "mixto";

export type LineaCobro = {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
};

type ItemRestante = LineaCobro & { cantidadRestante: number };

type PagoPersona = {
  etiqueta: string;
  metodo: MedioPago;
  monto: number;
  detalle: string;
};

function redondear(n: number) {
  return Math.round(n * 100) / 100;
}

export function FormularioCobro({
  pedidoId,
  total,
  aplicaServicio,
  lineas,
}: {
  pedidoId: string;
  total: number;
  aplicaServicio: boolean;
  lineas: LineaCobro[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { start: startNav } = useNavigationLoading();
  const [pending, startTransition] = useTransition();

  const [cuentasSeparadas, setCuentasSeparadas] = useState(false);

  // Cobro simple
  const [medioPago, setMedioPago] = useState<MedioPago>("efectivo");
  const [montoRecibido, setMontoRecibido] = useState(String(Math.ceil(total)));

  // Cuentas separadas
  const [restantes, setRestantes] = useState<ItemRestante[]>(() =>
    lineas.map((l) => ({ ...l, cantidadRestante: l.cantidad }))
  );
  const [seleccion, setSeleccion] = useState<Record<string, number>>({});
  const [etiqueta, setEtiqueta] = useState("Persona 1");
  const [metodoPersona, setMetodoPersona] = useState<MedioPago>("efectivo");
  const [recibidoPersona, setRecibidoPersona] = useState("");
  const [pagos, setPagos] = useState<PagoPersona[]>([]);

  const recibidoSimple = Number(montoRecibido) || 0;
  const vueltoSimple = useMemo(
    () => Math.max(0, recibidoSimple - total),
    [recibidoSimple, total]
  );

  const itemsPendientes = useMemo(
    () => restantes.filter((i) => i.cantidadRestante > 0),
    [restantes]
  );

  const subtotalSeleccionado = useMemo(() => {
    return redondear(
      itemsPendientes.reduce((acc, item) => {
        const qty = seleccion[item.id] ?? 0;
        return acc + qty * item.precioUnitario;
      }, 0)
    );
  }, [itemsPendientes, seleccion]);

  const servicioSeleccionado = aplicaServicio ? montoServicio(subtotalSeleccionado) : 0;
  const totalPersona = redondear(subtotalSeleccionado + servicioSeleccionado);

  const totalPagado = useMemo(
    () => redondear(pagos.reduce((acc, p) => acc + p.monto, 0)),
    [pagos]
  );

  const subtotalRestanteItems = useMemo(
    () =>
      redondear(
        restantes.reduce((acc, i) => acc + i.cantidadRestante * i.precioUnitario, 0)
      ),
    [restantes]
  );
  const servicioRestante = aplicaServicio ? montoServicio(subtotalRestanteItems) : 0;
  const totalRestanteItems = redondear(subtotalRestanteItems + servicioRestante);

  function setQty(itemId: string, qty: number, max: number) {
    const n = Math.max(0, Math.min(max, Math.floor(qty)));
    setSeleccion((prev) => ({ ...prev, [itemId]: n }));
  }

  function tomarTodoRestante() {
    const next: Record<string, number> = {};
    for (const item of itemsPendientes) {
      next[item.id] = item.cantidadRestante;
    }
    setSeleccion(next);
    setRecibidoPersona(String(Math.ceil(totalRestanteItems)));
  }

  function registrarPersona() {
    if (totalPersona <= 0) {
      toast("Selecciona al menos un producto para esta persona", "peligro");
      return;
    }

    const recibido = Number(recibidoPersona) || 0;
    if (recibido < totalPersona) {
      toast("El monto recibido es menor a lo que paga esta persona", "peligro");
      return;
    }

    const detalleParts: string[] = [];
    const nextRestantes = restantes.map((item) => {
      const qty = seleccion[item.id] ?? 0;
      if (qty > 0) {
        detalleParts.push(`${qty}x ${item.nombre}`);
        return { ...item, cantidadRestante: item.cantidadRestante - qty };
      }
      return item;
    });

    const nombre = etiqueta.trim() || `Persona ${pagos.length + 1}`;
    setPagos((prev) => [
      ...prev,
      {
        etiqueta: nombre,
        metodo: metodoPersona,
        monto: totalPersona,
        detalle: detalleParts.join(", "),
      },
    ]);
    setRestantes(nextRestantes);
    setSeleccion({});
    setEtiqueta(`Persona ${pagos.length + 2}`);
    setMetodoPersona("efectivo");
    setRecibidoPersona("");
    toast(`${nombre}: ${formatColon(totalPersona)} registrado`, "exito");
  }

  function reiniciarSeparadas() {
    setRestantes(lineas.map((l) => ({ ...l, cantidadRestante: l.cantidad })));
    setSeleccion({});
    setPagos([]);
    setEtiqueta("Persona 1");
    setRecibidoPersona("");
  }

  function cobrarSimple(e: React.FormEvent) {
    e.preventDefault();
    if (recibidoSimple < total) {
      toast("El monto recibido es menor al total", "peligro");
      return;
    }

    startTransition(async () => {
      try {
        const result = await crearComprobante({
          pedidoId,
          medioPago,
          montoRecibido: recibidoSimple,
        });

        if (!result?.ok) {
          toast(result?.error ?? "No se pudo completar el cobro", "peligro");
          return;
        }

        toast("Comprobante creado", "exito");
        startNav("Cargando facturación...");
        router.push("/facturacion");
        router.refresh();
      } catch (e) {
        const message = e instanceof Error ? e.message : "No se pudo completar el cobro";
        toast(message, "peligro");
      }
    });
  }

  function finalizarSeparadas() {
    if (itemsPendientes.length > 0) {
      toast("Aún quedan productos sin asignar", "peligro");
      return;
    }
    if (pagos.length === 0) {
      toast("Registra al menos un pago", "peligro");
      return;
    }
    if (Math.abs(totalPagado - total) > 0.05) {
      toast(
        `La suma de pagos (${formatColon(totalPagado)}) no cubre el total (${formatColon(total)})`,
        "peligro"
      );
      return;
    }

    startTransition(async () => {
      try {
        const result = await crearComprobanteConPagos({
          pedidoId,
          pagos: pagos.map((p) => ({
            metodo: p.metodo,
            monto: p.monto,
            etiqueta: `${p.etiqueta}: ${p.detalle}`,
          })),
        });

        if (!result?.ok) {
          toast(result?.error ?? "No se pudo completar el cobro dividido", "peligro");
          return;
        }

        toast(`Cuenta cobrada en ${pagos.length} pagos`, "exito");
        startNav("Cargando facturación...");
        router.push("/facturacion");
        router.refresh();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "No se pudo completar el cobro dividido";
        toast(message, "peligro");
      }
    });
  }

  // Prefill recibido when selection changes
  function onSeleccionChange(itemId: string, qty: number, max: number) {
    setQty(itemId, qty, max);
  }

  const recibidoPersonaNum = Number(recibidoPersona) || 0;
  const vueltoPersona = Math.max(0, recibidoPersonaNum - totalPersona);

  return (
    <>
      {pending ? <LoadingOverlay label="Procesando cobro..." /> : null}

      <div className="mt-4 space-y-4 border-t border-washi-200 pt-4 text-sumi-900">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={cuentasSeparadas}
            onChange={(e) => {
              const on = e.target.checked;
              setCuentasSeparadas(on);
              if (on) reiniciarSeparadas();
            }}
            className="h-4 w-4 accent-vermillion"
          />
          Cuentas separadas (cada quien elige qué paga)
        </label>

        {!cuentasSeparadas ? (
          <form onSubmit={cobrarSimple} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-sumi-900">Medio de pago</label>
              <Select
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value as MedioPago)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="sinpe">SINPE Movil</option>
                <option value="mixto">Mixto</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-sumi-900">Monto recibido</label>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="1"
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                className="min-h-11 text-base"
                required
              />
            </div>

            <div className="flex justify-between text-sm font-medium text-sumi-900">
              <span>Vuelto</span>
              <span>{formatColon(vueltoSimple)}</span>
            </div>

            <Button type="submit" className="min-h-11 w-full" disabled={pending}>
              {pending ? "Procesando..." : "Cobrar"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-gold/25 bg-washi/50 px-3 py-2 text-sm">
              <div className="flex justify-between">
                <span>Total cuenta</span>
                <span className="tabular-nums font-medium">{formatColon(total)}</span>
              </div>
              <div className="flex justify-between text-sumi-700">
                <span>Ya asignado</span>
                <span className="tabular-nums">{formatColon(totalPagado)}</span>
              </div>
              <div className="flex justify-between font-medium text-vermillion">
                <span>Pendiente</span>
                <span className="tabular-nums">{formatColon(totalRestanteItems)}</span>
              </div>
            </div>

            {pagos.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Pagos registrados</p>
                <ul className="space-y-1.5 text-sm">
                  {pagos.map((p, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-gold/20 bg-white/60 px-3 py-2"
                    >
                      <div className="flex justify-between gap-2 font-medium">
                        <span>{p.etiqueta}</span>
                        <span className="tabular-nums">{formatColon(p.monto)}</span>
                      </div>
                      <p className="text-xs text-sumi-600">
                        {p.metodo} · {p.detalle}
                      </p>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="text-xs text-sumi-600 underline-offset-2 hover:underline"
                  onClick={reiniciarSeparadas}
                >
                  Reiniciar división
                </button>
              </div>
            ) : null}

            {itemsPendientes.length > 0 ? (
              <div className="space-y-3 rounded-md border border-gold/30 p-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div className="min-w-[10rem] flex-1">
                    <label className="mb-1 block text-xs font-medium">Quién paga ahora</label>
                    <Input
                      value={etiqueta}
                      onChange={(e) => setEtiqueta(e.target.value)}
                      placeholder="Persona 1"
                    />
                  </div>
                  <Button type="button" variant="secondary" onClick={tomarTodoRestante}>
                    Tomar todo lo pendiente
                  </Button>
                </div>

                <p className="text-xs text-sumi-600">
                  Marca qué productos (y cantidades) paga esta persona. Se descuenta del total.
                </p>

                <ul className="space-y-2">
                  {itemsPendientes.map((item) => {
                    const qty = seleccion[item.id] ?? 0;
                    return (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-washi-200 pb-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-tight">{item.nombre}</p>
                          <p className="text-xs text-sumi-600">
                            {formatColon(item.precioUnitario)} · quedan {item.cantidadRestante}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gold/30"
                            onClick={() => onSeleccionChange(item.id, qty - 1, item.cantidadRestante)}
                          >
                            −
                          </button>
                          <Input
                            type="number"
                            min={0}
                            max={item.cantidadRestante}
                            value={qty}
                            onChange={(e) =>
                              onSeleccionChange(
                                item.id,
                                Number(e.target.value) || 0,
                                item.cantidadRestante
                              )
                            }
                            className="h-8 w-14 text-center"
                          />
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gold/30"
                            onClick={() => onSeleccionChange(item.id, qty + 1, item.cantidadRestante)}
                          >
                            +
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="space-y-1 border-t border-washi-200 pt-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal persona</span>
                    <span className="tabular-nums">{formatColon(subtotalSeleccionado)}</span>
                  </div>
                  {aplicaServicio ? (
                    <div className="flex justify-between text-sumi-700">
                      <span>Servicio (10%)</span>
                      <span className="tabular-nums">{formatColon(servicioSeleccionado)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-medium">
                    <span>Paga esta persona</span>
                    <span className="tabular-nums">{formatColon(totalPersona)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Medio</label>
                    <Select
                      value={metodoPersona}
                      onChange={(e) => setMetodoPersona(e.target.value as MedioPago)}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="sinpe">SINPE</option>
                      <option value="mixto">Mixto</option>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Recibido</label>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      value={recibidoPersona}
                      placeholder={totalPersona > 0 ? String(Math.ceil(totalPersona)) : "0"}
                      onChange={(e) => setRecibidoPersona(e.target.value)}
                      onFocus={() => {
                        if (!recibidoPersona && totalPersona > 0) {
                          setRecibidoPersona(String(Math.ceil(totalPersona)));
                        }
                      }}
                    />
                  </div>
                </div>

                {totalPersona > 0 ? (
                  <div className="flex justify-between text-xs text-sumi-700">
                    <span>Vuelto</span>
                    <span className="tabular-nums">{formatColon(vueltoPersona)}</span>
                  </div>
                ) : null}

                <Button
                  type="button"
                  className="w-full"
                  disabled={pending || totalPersona <= 0}
                  onClick={registrarPersona}
                >
                  Registrar pago de esta persona
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-wasabi-500">
                  Todos los productos ya están asignados. Puedes finalizar el cobro.
                </p>
                <Button
                  type="button"
                  className="min-h-11 w-full"
                  disabled={pending}
                  onClick={finalizarSeparadas}
                >
                  {pending ? "Procesando..." : `Finalizar cobro (${pagos.length} pagos)`}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
