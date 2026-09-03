"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { abrirTurnoCaja, cerrarTurnoCaja } from "@/actions/cierres.actions";
import { generarCierreDiario } from "@/actions/cierres.actions";

export function CajaControls({ turnoAbiertoId }: { turnoAbiertoId: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [montoApertura, setMontoApertura] = useState("0");
  const [montoContado, setMontoContado] = useState("0");

  function abrir(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await abrirTurnoCaja(Number(montoApertura));
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Turno abierto", "exito");
      router.refresh();
    });
  }

  function cerrar(e: React.FormEvent) {
    e.preventDefault();
    if (!turnoAbiertoId) return;
    startTransition(async () => {
      const result = await cerrarTurnoCaja({
        turnoId: turnoAbiertoId,
        montoContado: Number(montoContado),
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast(`Turno cerrado. Diferencia: ${result.diferencia}`, "exito");
      router.refresh();
    });
  }

  function cierreDiario() {
    startTransition(async () => {
      const hoy = new Date().toISOString().slice(0, 10);
      const result = await generarCierreDiario(hoy);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Cierre diario generado", "exito");
      router.refresh();
    });
  }

  return (
    <div className="mb-6 grid gap-3 lg:grid-cols-3">
      {!turnoAbiertoId ? (
        <Card>
          <CardHeader>
            <CardTitle>Abrir turno</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={abrir} className="space-y-3">
            <Input
              type="number"
              min={0}
              step="1"
              value={montoApertura}
              onChange={(e) => setMontoApertura(e.target.value)}
              placeholder="Monto apertura"
            />
            <Button type="submit" disabled={pending}>
              Abrir caja
            </Button>
          </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Cerrar turno</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={cerrar} className="space-y-3">
            <Input
              type="number"
              min={0}
              step="1"
              value={montoContado}
              onChange={(e) => setMontoContado(e.target.value)}
              placeholder="Monto contado"
            />
            <Button type="submit" disabled={pending}>
              Cerrar caja
            </Button>
          </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cierre diario</CardTitle>
        </CardHeader>
        <CardContent>
        <Button type="button" variant="secondary" disabled={pending} onClick={cierreDiario}>
          Generar cierre de hoy
        </Button>
        </CardContent>
      </Card>
    </div>
  );
}
