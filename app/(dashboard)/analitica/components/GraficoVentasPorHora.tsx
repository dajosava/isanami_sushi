"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatColon } from "@/lib/utils";
import type { VentaHora } from "../lib/types";

export function GraficoVentasPorHora({
  datos,
  cargando,
}: {
  datos: VentaHora[];
  cargando?: boolean;
}) {
  const chartData = datos.map((d) => ({
    ...d,
    etiqueta: `${String(d.hora).padStart(2, "0")}:00`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por hora (pico operativo)</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {cargando && datos.length === 0 ? (
          <div className="h-full animate-pulse rounded-md bg-washi-200/60" />
        ) : datos.length === 0 ? (
          <p className="text-sm text-sumi-700">Sin datos por hora.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d3" />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatColon(Number(v))} />
              <Bar dataKey="total" fill="#a8324c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
