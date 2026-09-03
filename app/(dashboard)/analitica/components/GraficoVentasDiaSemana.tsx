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
import type { VentaDiaSemana } from "../lib/types";

const NOMBRES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

export function GraficoVentasDiaSemana({
  datos,
  cargando,
}: {
  datos: VentaDiaSemana[];
  cargando?: boolean;
}) {
  const chartData = datos.map((d) => ({
    ...d,
    etiqueta: NOMBRES[d.dia_semana] ?? d.nombre,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por dia de la semana</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {cargando && datos.length === 0 ? (
          <div className="h-full animate-pulse rounded-md bg-washi-200/60" />
        ) : datos.length === 0 ? (
          <p className="text-sm text-sumi-700">Sin datos semanales.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d3" />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatColon(Number(v))} />
              <Bar dataKey="total" fill="#71914a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
