"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FieldCounter } from "@/components/ui/field-counter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { guardarInsumo } from "@/actions/admin.actions";
import { LIMITES } from "@/lib/limites-campos";

interface Unidad {
  id: string;
  nombre: string;
  abreviatura: string;
}

export function InsumoForm({ unidades }: { unidades: Unidad[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [stockActual, setStockActual] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await guardarInsumo({
        nombre,
        unidad_medida_id: unidadId,
        stock_minimo: Number(stockMinimo) || 0,
        stock_actual: Number(stockActual) || 0,
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Insumo creado", "exito");
      setNombre("");
      setStockMinimo("");
      setStockActual("");
      router.refresh();
    });
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Nuevo insumo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FieldCounter
            label="Nombre"
            value={nombre}
            max={LIMITES.insumoNombre}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Input
              placeholder="Ej. Salmón fresco"
              value={nombre}
              onChange={(e) => setNombre(e.target.value.slice(0, LIMITES.insumoNombre))}
              required
              maxLength={LIMITES.insumoNombre}
              minLength={2}
            />
          </FieldCounter>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-sumi-800">Unidad</label>
            <Select value={unidadId} onChange={(e) => setUnidadId(e.target.value)} required>
              <option value="" disabled>
                Selecciona unidad
              </option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.abreviatura})
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-sumi-800">Stock actual</label>
            <Input
              type="number"
              step="0.001"
              min="0"
              placeholder="Ej. 5"
              value={stockActual}
              onChange={(e) => setStockActual(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-sumi-800">Stock mínimo</label>
            <Input
              type="number"
              step="0.001"
              min="0"
              placeholder="Ej. 1"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending || !unidadId} className="w-full">
              Crear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
