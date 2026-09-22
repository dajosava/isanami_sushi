import { createClient } from "@/lib/supabase/server";
import { CompraMermaForms } from "@/components/inventario/compra-merma-forms";
import { ComprasHistorial } from "@/components/inventario/compras-historial";
import Link from "next/link";

export default async function ComprasPage() {
  const supabase = createClient();
  const [{ data: compras }, { data: proveedores }, { data: insumos }, { data: unidades }] =
    await Promise.all([
      supabase
        .from("compras")
        .select(
          "id, fecha, subtotal, total_impuesto, impuesto_iva_pct, total, estado, categoria_gasto, concepto, numero_factura_proveedor, proveedores(nombre), compras_items(cantidad, costo_unitario, insumos(nombre), unidades_medida(nombre, abreviatura))"
        )
        .order("fecha", { ascending: false })
        .limit(50),
      supabase.from("proveedores").select("id, nombre").order("nombre"),
      supabase.from("insumos").select("id, nombre, unidad_medida_id").order("nombre"),
      supabase.from("unidades_medida").select("id, nombre, abreviatura").order("nombre"),
    ]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-xl text-washi-50 sm:text-2xl">Compras y gastos</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/inventario/insumos" className="underline hover:text-white">
            Insumos
          </Link>
          <Link href="/inventario/recetas" className="underline hover:text-white">
            Recetas
          </Link>
        </div>
      </div>

      <p className="text-sm text-washi-50/80">
        Registra facturas con proveedor, fecha, número, subtotal, IVA y total. Clasifica el
        gasto (mercadería, limpieza, alquiler…). Solo la categoría{" "}
        <strong className="font-medium text-washi-50">mercadería</strong> suma stock; el
        descuento de ingredientes ocurre al{" "}
        <strong className="font-medium text-washi-50">cobrar</strong> (según receta).
      </p>

      <CompraMermaForms
        proveedores={proveedores ?? []}
        insumos={insumos ?? []}
        unidades={unidades ?? []}
      />

      <ComprasHistorial compras={(compras ?? []) as never} />
    </div>
  );
}
