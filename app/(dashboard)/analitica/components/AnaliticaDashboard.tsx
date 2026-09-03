"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DashboardAnalitica, FiltrosAnalitica } from "../lib/types";
import { FiltrosFecha } from "./FiltrosFecha";
import { TarjetasKPI } from "./TarjetasKPI";
import { TopProductos } from "./TopProductos";
import { TablaOperacion } from "./TablaOperacion";
import { CierreCajaTable } from "./CierreCajaTable";
import { ExportarReportes } from "./ExportarReportes";
import { filtrosBorradorInicial } from "../lib/fechas";

const chartLoading = () => (
  <div className="h-72 animate-pulse rounded-md bg-washi-200/60" />
);

const GraficoVentasTiempo = dynamic(
  () => import("./GraficoVentasTiempo").then((m) => m.GraficoVentasTiempo),
  { ssr: false, loading: chartLoading }
);
const GraficoVentasPorHora = dynamic(
  () => import("./GraficoVentasPorHora").then((m) => m.GraficoVentasPorHora),
  { ssr: false, loading: chartLoading }
);
const GraficoVentasDiaSemana = dynamic(
  () => import("./GraficoVentasDiaSemana").then((m) => m.GraficoVentasDiaSemana),
  { ssr: false, loading: chartLoading }
);
const VentasPorCategoria = dynamic(
  () => import("./VentasPorCategoria").then((m) => m.VentasPorCategoria),
  { ssr: false, loading: chartLoading }
);
const VentasPorMetodoPago = dynamic(
  () => import("./VentasPorMetodoPago").then((m) => m.VentasPorMetodoPago),
  { ssr: false, loading: chartLoading }
);

async function fetchDashboard(filtros: FiltrosAnalitica): Promise<DashboardAnalitica> {
  const params = new URLSearchParams({
    desde: filtros.desde,
    hasta: filtros.hasta,
    preset: filtros.preset,
  });
  if (filtros.canal) params.set("canal", filtros.canal);
  const res = await fetch(`/api/analitica/dashboard?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Error al cargar analitica");
  }
  return res.json();
}

export function AnaliticaDashboard() {
  const [borrador, setBorrador] = useState<FiltrosAnalitica>(filtrosBorradorInicial);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosAnalitica | null>(null);

  const { data, isFetching, error } = useQuery({
    queryKey: ["analitica", filtrosAplicados],
    queryFn: () => fetchDashboard(filtrosAplicados!),
    enabled: filtrosAplicados !== null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    meta: { hideGlobalLoader: true },
  });

  function aplicarFiltros(filtros: FiltrosAnalitica) {
    setBorrador(filtros);
    setFiltrosAplicados(filtros);
  }

  const consultado = filtrosAplicados !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Analitica y reporteria</h1>
          <p className="mt-1 text-sm text-washi-50/80">
            {consultado && data
              ? `Periodo: ${data.filtros.desde} — ${data.filtros.hasta} (hora Costa Rica)`
              : "Selecciona un periodo para consultar los datos"}
          </p>
        </div>
        {consultado && filtrosAplicados ? (
          <ExportarReportes filtros={filtrosAplicados} />
        ) : null}
      </div>

      <FiltrosFecha
        filtros={borrador}
        onBorradorChange={setBorrador}
        onAplicar={aplicarFiltros}
        cargando={isFetching}
      />

      {error ? (
        <p className="rounded-lg border border-umeboshi-500/40 bg-umeboshi-500/10 p-4 text-sm text-washi-50">
          {(error as Error).message}
          <span className="mt-2 block text-xs opacity-80">
            Si acabas de desplegar, aplica las migraciones 0015 y 0018 en Supabase.
          </span>
        </p>
      ) : null}

      {!consultado && !isFetching ? (
        <div className="isanami-panel flex min-h-[40vh] flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="font-display text-lg text-washi-50">Sin datos cargados</p>
          <p className="max-w-md text-sm text-washi-50/75">
            Elige un rango rapido (Hoy, 7 dias, Mes actual…) o define fechas personalizadas y
            pulsa Consultar.
          </p>
        </div>
      ) : null}

      {consultado && data ? (
        <>
          <TarjetasKPI kpis={data.kpis} cargando={isFetching} />

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <GraficoVentasTiempo datos={data.ventasPorDia} cargando={isFetching} />
            <GraficoVentasPorHora datos={data.ventasPorHora} cargando={isFetching} />
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <GraficoVentasDiaSemana datos={data.ventasDiaSemana} cargando={isFetching} />
            <VentasPorCategoria datos={data.porCategoria} cargando={isFetching} />
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <TopProductos titulo="Top 10 productos" datos={data.topProductos} cargando={isFetching} />
            <TopProductos titulo="Menor rotacion" datos={data.bajaRotacion} cargando={isFetching} baja />
          </div>

          <VentasPorMetodoPago datos={data.pagosMetodo} cargando={isFetching} />

          <TablaOperacion
            porMesero={data.porMesero}
            porMesa={data.porMesa}
            tiempoMesa={data.tiempoMesa}
            cargando={isFetching}
          />

          <CierreCajaTable datos={data.conciliacion} cargando={isFetching} />
        </>
      ) : null}

      {consultado && isFetching && !data ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-white/10" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div className="h-72 rounded-lg bg-white/10" />
            <div className="h-72 rounded-lg bg-white/10" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
