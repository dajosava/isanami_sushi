"use client";

import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { FiltrosAnalitica, PresetFecha } from "../lib/types";
import { CANALES } from "../lib/types";
import { filtrosListos, rangoDesdePreset } from "../lib/fechas";

const ETIQUETAS: Record<PresetFecha, string> = {
  hoy: "Hoy",
  ayer: "Ayer",
  "7d": "Ultimos 7 dias",
  "30d": "Ultimos 30 dias",
  mes_actual: "Mes actual",
  mes_anterior: "Mes anterior",
  personalizado: "Personalizado",
};

export function FiltrosFecha({
  filtros,
  onBorradorChange,
  onAplicar,
  cargando,
}: {
  filtros: FiltrosAnalitica;
  onBorradorChange: (f: FiltrosAnalitica) => void;
  onAplicar: (f: FiltrosAnalitica) => void;
  cargando?: boolean;
}) {
  function cambiarPreset(preset: PresetFecha) {
    if (preset === "personalizado") {
      onBorradorChange({ ...filtros, preset });
      return;
    }
    const { desde, hasta } = rangoDesdePreset(preset);
    onAplicar({ ...filtros, preset, desde, hasta });
  }

  function consultarPersonalizado() {
    if (!filtrosListos(filtros)) return;
    onAplicar(filtros);
  }

  function cambiarCanal(canal: FiltrosAnalitica["canal"]) {
    const actualizado = { ...filtros, canal };
    onBorradorChange(actualizado);
    if (filtrosListos(actualizado)) {
      onAplicar(actualizado);
    }
  }

  return (
    <div className="isanami-panel overflow-hidden">
      <div className="isanami-panel-header px-4 py-3">
        <h2 className="font-display text-lg font-semibold text-washi-50">Filtros</h2>
        {cargando ? <span className="text-xs text-washi-50/70">Actualizando...</span> : null}
      </div>
      <div className="isanami-panel-body flex flex-wrap items-end gap-3 p-4">
        <div className="isanami-category-scroll -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible">
          {(Object.keys(ETIQUETAS) as PresetFecha[]).map((p) => (
            <Button
              key={p}
              type="button"
              variant={filtros.preset === p ? "primary" : "secondary"}
              className="h-9 shrink-0 text-xs md:h-8"
              onClick={() => cambiarPreset(p)}
            >
              {ETIQUETAS[p]}
            </Button>
          ))}
        </div>

        {filtros.preset === "personalizado" && (
          <>
            <input
              type="date"
              className="isanami-field max-w-[10rem]"
              value={filtros.desde}
              onChange={(e) => onBorradorChange({ ...filtros, desde: e.target.value })}
            />
            <input
              type="date"
              className="isanami-field max-w-[10rem]"
              value={filtros.hasta}
              onChange={(e) => onBorradorChange({ ...filtros, hasta: e.target.value })}
            />
            <Button
              type="button"
              variant="primary"
              className="h-9 md:h-8"
              disabled={!filtrosListos(filtros) || cargando}
              onClick={consultarPersonalizado}
            >
              Consultar
            </Button>
          </>
        )}

        <div className="min-w-[10rem]">
          <label className="mb-1 block text-xs font-medium text-sumi-700">Canal</label>
          <Select
            value={filtros.canal ?? ""}
            onChange={(e) =>
              cambiarCanal(
                e.target.value ? (e.target.value as FiltrosAnalitica["canal"]) : null
              )
            }
          >
            <option value="">Todos</option>
            {CANALES.map((c) => (
              <option key={c} value={c}>
                {c.replace("_", " ")}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
