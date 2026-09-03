"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatColon } from "@/lib/utils";
import type { CategoriaVenta } from "../lib/types";

const COLORES = ["#c94b66", "#a8324c", "#71914a", "#2c4a63", "#e87a90", "#8fae5d", "#b3462c"];

export function VentasPorCategoria({
  datos,
  cargando,
}: {
  datos: CategoriaVenta[];
  cargando?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por categoria</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {cargando && datos.length === 0 ? (
          <div className="h-full animate-pulse rounded-md bg-washi-200/60" />
        ) : datos.length === 0 ? (
          <p className="text-sm text-sumi-700">Sin ventas por categoria.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={datos} dataKey="ingresos" nameKey="categoria" cx="50%" cy="50%" outerRadius={90}>
                {datos.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatColon(Number(v))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
