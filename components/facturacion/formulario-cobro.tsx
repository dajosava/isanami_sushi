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
import { crearComprobante } from "@/actions/facturacion.actions";

type MedioPago = "efectivo" | "tarjeta" | "sinpe" | "mixto";

export function FormularioCobro({
  pedidoId,
  total,
}: {
  pedidoId: string;
  total: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { start: startNav } = useNavigationLoading();
  const [medioPago, setMedioPago] = useState<MedioPago>("efectivo");
  const [montoRecibido, setMontoRecibido] = useState(String(Math.ceil(total)));
  const [pending, startTransition] = useTransition();

  const recibido = Number(montoRecibido) || 0;
  const vuelto = useMemo(() => Math.max(0, recibido - total), [recibido, total]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (recibido < total) {
      toast("El monto recibido es menor al total", "peligro");
      return;
    }

    startTransition(async () => {
      const result = await crearComprobante({
        pedidoId,
        medioPago,
        montoRecibido: recibido,
      });

      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }

      toast("Comprobante creado", "exito");
      startNav("Cargando facturación...");
      router.push("/facturacion");
      router.refresh();
    });
  }

  return (
    <>
      {pending ? <LoadingOverlay label="Procesando cobro..." /> : null}
      <form onSubmit={onSubmit} className="mt-4 space-y-4 border-t border-washi-200 pt-4 text-sumi-900">
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
        <span>{formatColon(vuelto)}</span>
      </div>

      <Button type="submit" className="min-h-11 w-full" disabled={pending}>
        {pending ? "Procesando..." : "Cobrar"}
      </Button>
    </form>
    </>
  );
}
