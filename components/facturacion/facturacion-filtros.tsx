"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigationLoading } from "@/components/providers/navigation-progress";

export function FacturacionFiltros({
  fechaDesde,
  fechaHasta,
}: {
  fechaDesde: string;
  fechaHasta: string;
}) {
  const router = useRouter();
  const { start: startNav } = useNavigationLoading();
  const [desde, setDesde] = useState(fechaDesde);
  const [hasta, setHasta] = useState(fechaHasta);

  function aplicar() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) return;
    if (desde > hasta) return;

    startNav("Filtrando comprobantes...");
    const params = new URLSearchParams();
    params.set("desde", desde);
    params.set("hasta", hasta);
    router.push(`/facturacion?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-sumi-800">Desde</label>
        <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-sumi-800">Hasta</label>
        <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
      </div>
      <Button type="button" variant="secondary" onClick={aplicar}>
        Filtrar
      </Button>
    </div>
  );
}
