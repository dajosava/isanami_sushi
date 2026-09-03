"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { anularComprobante } from "@/actions/facturacion.actions";

export function FacturaAcciones({
  facturaId,
  estado,
}: {
  facturaId: string;
  estado: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [motivo, setMotivo] = useState("");
  const [showAnular, setShowAnular] = useState(false);
  const [pending, startTransition] = useTransition();

  function onAnular(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await anularComprobante(facturaId, motivo);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Comprobante anulado", "exito");
      setShowAnular(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/facturacion/${facturaId}`}
        className="isanami-touch-target inline-flex items-center justify-center rounded-md bg-washi-100 px-3 py-2 text-xs font-medium hover:bg-washi-200"
      >
        Ver / imprimir
      </Link>
      {estado !== "anulada" && (
        <>
          {!showAnular ? (
            <Button type="button" variant="danger" className="px-3 py-1.5 text-xs" onClick={() => setShowAnular(true)}>
              Anular
            </Button>
          ) : (
            <form onSubmit={onAnular} className="flex w-full min-w-[220px] flex-col gap-2 sm:w-auto">
              <Textarea
                rows={2}
                placeholder="Motivo de anulacion"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" variant="danger" disabled={pending} className="text-xs">
                  Confirmar
                </Button>
                <Button type="button" variant="ghost" className="text-xs" onClick={() => setShowAnular(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
