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
import type { PagoMetodo } from "../lib/types";

const COLORES = ["#71914a", "#2c4a63", "#c94b66", "#8fae5d"];

export function VentasPorMetodoPago({
  datos,
  cargando,
}: {
  datos: PagoMetodo[];
  cargando?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metodos de pago</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {cargando && datos.length === 0 ? (
          <div className="h-full animate-pulse rounded-md bg-washi-200/60" />
        ) : datos.length === 0 ? (
          <p className="text-sm text-sumi-700">Sin pagos registrados.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={datos} dataKey="total" nameKey="metodo" cx="50%" cy="50%" outerRadius={80}>
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
