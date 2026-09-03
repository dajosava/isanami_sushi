"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { guardarReceta } from "@/actions/admin.actions";

interface Option {
  id: string;
  nombre: string;
}

export function RecetaForm({
  productos,
  insumos,
  unidades,
}: {
  productos: Option[];
  insumos: Option[];
  unidades: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [productoId, setProductoId] = useState(productos[0]?.id ?? "");
  const [insumoId, setInsumoId] = useState(insumos[0]?.id ?? "");
  const [unidadId, setUnidadId] = useState(unidades[0]?.id ?? "");
  const [cantidad, setCantidad] = useState("1");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await guardarReceta({
        producto_id: productoId,
        insumo_id: insumoId,
        cantidad_requerida: Number(cantidad),
        unidad_medida_id: unidadId,
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Receta actualizada", "exito");
      router.refresh();
    });
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Agregar insumo a receta</CardTitle>
      </CardHeader>
      <CardContent>
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select value={productoId} onChange={(e) => setProductoId(e.target.value)} required>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
        <Select value={insumoId} onChange={(e) => setInsumoId(e.target.value)} required>
          {insumos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          step="0.001"
          min="0.001"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          required
        />
        <Select value={unidadId} onChange={(e) => setUnidadId(e.target.value)} required>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </Select>
        <Button type="submit" disabled={pending}>
          Guardar
        </Button>
      </form>
      </CardContent>
    </Card>
  );
}
