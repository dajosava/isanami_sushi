import { createClient } from "@/lib/supabase/server";
import { CocinaRealtimeBoard } from "@/components/cocina/cocina-realtime-board";

export default async function CocinaPage() {
  const supabase = createClient();

  const { data: comandas } = await supabase
    .from("comandas")
    .select("id, pedido_id, estacion, estado, items, creada_en, pedidos(tipo, mesas(numero))")
    .not("estado", "in", "(lista,anulada)")
    .order("creada_en", { ascending: true })
    .limit(100);

  return (
    <div>
      <h1 className="mb-4 font-display text-xl text-washi-50 sm:mb-6 sm:text-2xl">Cocina</h1>
      <CocinaRealtimeBoard comandasIniciales={comandas ?? []} />
    </div>
  );
}
