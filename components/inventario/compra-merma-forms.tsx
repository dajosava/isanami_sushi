"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldCounter } from "@/components/ui/field-counter";
import { IsanamiSection } from "@/components/ui/isanami-section";
import { useToast } from "@/components/ui/toast";
import { registrarCompra, registrarMerma } from "@/actions/inventario.actions";
import {
  CATEGORIAS_GASTO,
  TASAS_IVA_COMPRA,
  calcularMontosCompra,
  type CategoriaGasto,
  type TasaIvaCompra,
} from "@/lib/compras/categorias";
import { LIMITES } from "@/lib/limites-campos";
import { formatColon } from "@/lib/utils";

interface Option {
  id: string;
  nombre: string;
}

interface InsumoOption {
  id: string;
  nombre: string;
  unidad_medida_id: string | null;
}

interface UnidadOption {
  id: string;
  nombre: string;
  abreviatura: string;
}

function hoyLocalYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CompraMermaForms({
  proveedores,
  insumos,
  unidades,
}: {
  proveedores: Option[];
  insumos: InsumoOption[];
  unidades: UnidadOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [proveedorNombre, setProveedorNombre] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [fecha, setFecha] = useState(hoyLocalYYYYMMDD);
  const [categoria, setCategoria] = useState<CategoriaGasto>("mercaderia");
  const [ivaPct, setIvaPct] = useState<TasaIvaCompra>(13);
  const [concepto, setConcepto] = useState("");
  const [subtotalManual, setSubtotalManual] = useState("");

  const [insumoNombre, setInsumoNombre] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [cantidadCompra, setCantidadCompra] = useState("");
  const [costo, setCosto] = useState("");

  const [insumoMermaId, setInsumoMermaId] = useState("");
  const [cantidadMerma, setCantidadMerma] = useState("");
  const [motivo, setMotivo] = useState("");

  const esMercaderia = categoria === "mercaderia";

  const insumoMatch = useMemo(() => {
    const n = insumoNombre.trim().toLocaleLowerCase("es");
    if (!n) return null;
    return (
      insumos.find((i) => i.nombre.trim().toLocaleLowerCase("es") === n) ?? null
    );
  }, [insumoNombre, insumos]);

  useEffect(() => {
    if (insumoMatch?.unidad_medida_id) {
      setUnidadId(insumoMatch.unidad_medida_id);
    }
  }, [insumoMatch?.id, insumoMatch?.unidad_medida_id]);

  const subtotalPreview = useMemo(() => {
    if (esMercaderia) {
      const c = Number(cantidadCompra);
      const u = Number(costo);
      if (!(c > 0) || !(u >= 0)) return 0;
      return c * u;
    }
    const s = Number(subtotalManual);
    return Number.isFinite(s) && s > 0 ? s : 0;
  }, [esMercaderia, cantidadCompra, costo, subtotalManual]);

  const montosPreview = useMemo(
    () => calcularMontosCompra(subtotalPreview, ivaPct),
    [subtotalPreview, ivaPct]
  );

  function onCompra(e: React.FormEvent) {
    e.preventDefault();
    if (esMercaderia && !unidadId) {
      toast("Selecciona la unidad de medida", "peligro");
      return;
    }
    startTransition(async () => {
      const result = await registrarCompra({
        proveedorNombre,
        numeroFacturaProveedor: numeroFactura || undefined,
        fecha,
        categoriaGasto: categoria,
        impuestoIvaPct: ivaPct,
        concepto: concepto || undefined,
        subtotal: esMercaderia ? undefined : Number(subtotalManual),
        items: esMercaderia
          ? [
              {
                insumoNombre,
                unidadMedidaId: unidadId,
                cantidad: Number(cantidadCompra),
                costoUnitario: Number(costo),
              },
            ]
          : undefined,
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast(
        esMercaderia
          ? insumoMatch
            ? "Compra registrada"
            : "Compra registrada · insumo agregado al catálogo"
          : "Gasto registrado",
        "exito"
      );
      setProveedorNombre("");
      setNumeroFactura("");
      setFecha(hoyLocalYYYYMMDD());
      setConcepto("");
      setSubtotalManual("");
      setInsumoNombre("");
      setUnidadId("");
      setCantidadCompra("");
      setCosto("");
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
      setCantidadMerma("");
      setInsumoMermaId("");
      router.refresh();
    });
  }

  const puedeGuardar =
    proveedorNombre.trim() &&
    fecha &&
    (esMercaderia
      ? insumoNombre.trim() && unidadId && Number(cantidadCompra) > 0
      : concepto.trim() && Number(subtotalManual) > 0);

  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-2">
      <IsanamiSection
        title="Registrar factura / gasto"
        subtitle="Proveedor, fecha, montos e IVA · clasifica el tipo de gasto"
        collapsible
        defaultOpen
        bodyClassName="p-4"
      >
        <form onSubmit={onCompra} className="space-y-3">
          <FieldCounter label="Proveedor" value={proveedorNombre} max={LIMITES.proveedorNombre}>
            <Input
              list="proveedores-sugeridos"
              placeholder="Ej. Mariscos del Pacífico"
              value={proveedorNombre}
              onChange={(e) =>
                setProveedorNombre(e.target.value.slice(0, LIMITES.proveedorNombre))
              }
              required
              maxLength={LIMITES.proveedorNombre}
            />
          </FieldCounter>
          <datalist id="proveedores-sugeridos">
            {proveedores.map((p) => (
              <option key={p.id} value={p.nombre} />
            ))}
          </datalist>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-sumi-800">Fecha</label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-sumi-800">Nº factura</label>
              <Input
                placeholder="Ej. FAC-00123"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value.slice(0, 40))}
                maxLength={40}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-sumi-800">Categoría</label>
              <Select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
                required
              >
                {CATEGORIAS_GASTO.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-sumi-800">IVA</label>
              <Select
                value={String(ivaPct)}
                onChange={(e) => setIvaPct(Number(e.target.value) as TasaIvaCompra)}
                required
              >
                {TASAS_IVA_COMPRA.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {esMercaderia ? (
            <>
              <FieldCounter label="Insumo" value={insumoNombre} max={LIMITES.insumoNombre}>
                <Input
                  list="insumos-sugeridos"
                  placeholder="Ej. Arroz sushi"
                  value={insumoNombre}
                  onChange={(e) =>
                    setInsumoNombre(e.target.value.slice(0, LIMITES.insumoNombre))
                  }
                  required
                  maxLength={LIMITES.insumoNombre}
                />
              </FieldCounter>
              <datalist id="insumos-sugeridos">
                {insumos.map((i) => (
                  <option key={i.id} value={i.nombre} />
                ))}
              </datalist>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-sumi-800">
                  Unidad de medida
                </label>
                <Select value={unidadId} onChange={(e) => setUnidadId(e.target.value)} required>
                  <option value="" disabled>
                    Selecciona (kg, g, l, paquete…)
                  </option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.abreviatura})
                    </option>
                  ))}
                </Select>
                {!insumoMatch && insumoNombre.trim() ? (
                  <p className="text-xs text-sumi-600">
                    Insumo nuevo: esta unidad quedará en el catálogo.
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="Cantidad (ej. 2)"
                  value={cantidadCompra}
                  onChange={(e) => setCantidadCompra(e.target.value)}
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Costo unitario ₡ (sin IVA)"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <FieldCounter
                label="Concepto"
                value={concepto}
                max={LIMITES.compraConcepto}
              >
                <Input
                  placeholder="Ej. Alquiler local marzo"
                  value={concepto}
                  onChange={(e) =>
                    setConcepto(e.target.value.slice(0, LIMITES.compraConcepto))
                  }
                  required
                  maxLength={LIMITES.compraConcepto}
                />
              </FieldCounter>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-sumi-800">
                  Subtotal (sin IVA)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Monto ₡"
                  value={subtotalManual}
                  onChange={(e) => setSubtotalManual(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="rounded-md border border-washi-200 bg-washi-50/60 px-3 py-2 text-sm text-sumi-800">
            <div className="flex justify-between gap-2">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatColon(montosPreview.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Impuesto ({ivaPct}%)</span>
              <span className="tabular-nums">{formatColon(montosPreview.totalImpuesto)}</span>
            </div>
            <div className="mt-1 flex justify-between gap-2 border-t border-washi-200 pt-1 font-medium">
              <span>Total</span>
              <span className="tabular-nums">{formatColon(montosPreview.total)}</span>
            </div>
          </div>

          <Button type="submit" disabled={pending || !puedeGuardar}>
            Guardar factura
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
          <div className="space-y-1">
            <label className="block text-sm font-medium text-sumi-800">Insumo</label>
            <Select
              value={insumoMermaId}
              onChange={(e) => setInsumoMermaId(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecciona un insumo
              </option>
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
            </Select>
          </div>
          <Input
            type="number"
            step="0.001"
            min="0.001"
            placeholder="Cantidad a dar de baja"
            value={cantidadMerma}
            onChange={(e) => setCantidadMerma(e.target.value)}
            required
          />
          <Textarea
            placeholder="Motivo de la merma (ej. vencido, roto)"
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
