import { createClient } from "@/lib/supabase/server";
import { CompraMermaForms } from "@/components/inventario/compra-merma-forms";
import { ComprasHistorial } from "@/components/inventario/compras-historial";
import Link from "next/link";

export default async function ComprasPage() {
  const supabase = createClient();
  const [{ data: compras }, { data: proveedores }, { data: insumos }] = await Promise.all([
    supabase
      .from("compras")
      .select("id, fecha, total, estado, proveedores(nombre)")
      .order("fecha", { ascending: false })
      .limit(50),
    supabase.from("proveedores").select("id, nombre").order("nombre"),
    supabase.from("insumos").select("id, nombre").order("nombre"),
  ]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-xl text-washi-50 sm:text-2xl">Compras a proveedores</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/inventario/insumos" className="underline hover:text-white">
            Insumos
          </Link>
          <Link href="/inventario/recetas" className="underline hover:text-white">
            Recetas
          </Link>
        </div>
      </div>

      <CompraMermaForms proveedores={proveedores ?? []} insumos={insumos ?? []} />

      <ComprasHistorial compras={(compras ?? []) as never} />
    </div>
  );
}
