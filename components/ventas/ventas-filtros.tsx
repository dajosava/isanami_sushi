"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigationLoading } from "@/components/providers/navigation-progress";
import {
  detectarPreset,
  rangoPresetVentas,
  type PresetVentas,
} from "@/lib/ventas/periodo";

const ATAJOS: { id: PresetVentas; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "anio", label: "Año" },
];

export function VentasFiltros({
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
  const presetActivo = detectarPreset(fechaDesde, fechaHasta);

  function navegar(nextDesde: string, nextHasta: string, preset: PresetVentas) {
    startNav("Filtrando ventas...");
    const params = new URLSearchParams();
    params.set("desde", nextDesde);
    params.set("hasta", nextHasta);
    params.set("preset", preset);
    router.push(`/ventas?${params.toString()}`);
  }

  function aplicarAtajo(preset: PresetVentas) {
    const rango = rangoPresetVentas(preset);
    setDesde(rango.desde);
    setHasta(rango.hasta);
    navegar(rango.desde, rango.hasta, preset);
  }

  function aplicarPersonalizado() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) return;
    if (desde > hasta) return;
    navegar(desde, hasta, "personalizado");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ATAJOS.map((a) => (
          <Button
            key={a.id}
            type="button"
            variant={presetActivo === a.id ? "primary" : "secondary"}
            onClick={() => aplicarAtajo(a.id)}
            className="min-h-10"
          >
            {a.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-sumi-800">Desde</label>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-sumi-800">Hasta</label>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <Button type="button" variant="secondary" onClick={aplicarPersonalizado}>
          Filtrar
        </Button>
      </div>
    </div>
  );
}
