"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IsanamiSection } from "@/components/ui/isanami-section";
import { useToast } from "@/components/ui/toast";
import { registrarCompra, registrarMerma } from "@/actions/inventario.actions";

interface Option {
  id: string;
  nombre: string;
}

export function CompraMermaForms({
  proveedores,
  insumos,
}: {
  proveedores: Option[];
  insumos: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [proveedorId, setProveedorId] = useState(proveedores[0]?.id ?? "");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [insumoCompraId, setInsumoCompraId] = useState(insumos[0]?.id ?? "");
  const [cantidadCompra, setCantidadCompra] = useState("1");
  const [costo, setCosto] = useState("0");

  const [insumoMermaId, setInsumoMermaId] = useState(insumos[0]?.id ?? "");
  const [cantidadMerma, setCantidadMerma] = useState("1");
  const [motivo, setMotivo] = useState("");

  function onCompra(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await registrarCompra({
        proveedorId,
        numeroFacturaProveedor: numeroFactura || undefined,
        items: [
          {
            insumoId: insumoCompraId,
            cantidad: Number(cantidadCompra),
            costoUnitario: Number(costo),
          },
        ],
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Compra registrada", "exito");
      router.refresh();
    });
  }

  function onMerma(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await registrarMerma({
        insumoId: insumoMermaId,
        cantidad: Number(cantidadMerma),
        motivo,
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Merma registrada", "exito");
      setMotivo("");
      router.refresh();
    });
  }

  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-2">
      <IsanamiSection
        title="Registrar compra"
        subtitle="Entrada de insumos desde proveedor"
        collapsible
        defaultOpen
        bodyClassName="p-4"
      >
        <form onSubmit={onCompra} className="space-y-3">
          <Select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} required>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
          <Input
            placeholder="No. factura proveedor"
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
          />
          <Select value={insumoCompraId} onChange={(e) => setInsumoCompraId(e.target.value)} required>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              step="0.001"
              min="0.001"
              placeholder="Cantidad"
              value={cantidadCompra}
              onChange={(e) => setCantidadCompra(e.target.value)}
              required
            />
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Costo unitario"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={pending || !proveedorId || !insumoCompraId}>
            Guardar compra
          </Button>
        </form>
      </IsanamiSection>

      <IsanamiSection
        title="Registrar merma"
        subtitle="Baja de stock por perdida o vencimiento"
        collapsible
        defaultOpen={false}
        bodyClassName="p-4"
      >
        <form onSubmit={onMerma} className="space-y-3">
          <Select value={insumoMermaId} onChange={(e) => setInsumoMermaId(e.target.value)} required>
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
            placeholder="Cantidad"
            value={cantidadMerma}
            onChange={(e) => setCantidadMerma(e.target.value)}
            required
          />
          <Textarea
            placeholder="Motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            rows={2}
          />
          <Button type="submit" disabled={pending || !insumoMermaId}>
            Guardar merma
          </Button>
        </form>
      </IsanamiSection>
    </div>
  );
}
