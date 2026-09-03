"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatColon } from "@/lib/utils";
import type { VentaDia } from "../lib/types";

export function GraficoVentasTiempo({
  datos,
  cargando,
}: {
  datos: VentaDia[];
  cargando?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por dia</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {cargando && datos.length === 0 ? (
          <div className="h-full animate-pulse rounded-md bg-washi-200/60" />
        ) : datos.length === 0 ? (
          <p className="text-sm text-sumi-700">Sin ventas en este periodo.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d3" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatColon(Number(v))} />
              <Line type="monotone" dataKey="total" stroke="#c94b66" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
