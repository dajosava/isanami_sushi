"use client";

import { Button } from "@/components/ui/button";
import type { FiltrosAnalitica } from "../lib/types";

export function ExportarReportes({ filtros }: { filtros: FiltrosAnalitica }) {
  function exportar(tipo: string) {
    const params = new URLSearchParams({
      tipo,
      desde: filtros.desde,
      hasta: filtros.hasta,
    });
    if (filtros.canal) params.set("canal", filtros.canal);
    window.open(`/api/analitica/export?${params}`, "_blank");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" className="h-8 text-xs" onClick={() => exportar("libro_ventas")}>
        CSV libro de ventas
      </Button>
      <Button type="button" variant="secondary" className="h-8 text-xs" onClick={() => exportar("productos")}>
        CSV por producto
      </Button>
      <Button type="button" variant="secondary" className="h-8 text-xs" onClick={() => exportar("meseros")}>
        CSV por mesero
      </Button>
      <Button type="button" variant="secondary" className="h-8 text-xs" onClick={() => exportar("dashboard")}>
        CSV resumen
      </Button>
    </div>
  );
}
