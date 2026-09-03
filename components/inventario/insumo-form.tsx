"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { guardarInsumo } from "@/actions/admin.actions";

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
  const [unidadId, setUnidadId] = useState(unidades[0]?.id ?? "");
  const [stockMinimo, setStockMinimo] = useState("0");
  const [stockActual, setStockActual] = useState("0");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await guardarInsumo({
        nombre,
        unidad_medida_id: unidadId,
        stock_minimo: Number(stockMinimo),
        stock_actual: Number(stockActual),
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Insumo creado", "exito");
      setNombre("");
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
        <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <Select value={unidadId} onChange={(e) => setUnidadId(e.target.value)} required>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre} ({u.abreviatura})
            </option>
          ))}
        </Select>
        <Input
          type="number"
          step="0.001"
          min="0"
          placeholder="Stock actual"
          value={stockActual}
          onChange={(e) => setStockActual(e.target.value)}
        />
        <Input
          type="number"
          step="0.001"
          min="0"
          placeholder="Stock minimo"
          value={stockMinimo}
          onChange={(e) => setStockMinimo(e.target.value)}
        />
        <Button type="submit" disabled={pending || !unidadId}>
          Crear
        </Button>
      </form>
      </CardContent>
    </Card>
  );
}
