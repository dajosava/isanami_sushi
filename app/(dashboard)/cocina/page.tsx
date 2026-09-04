import { createClient } from "@/lib/supabase/server";
import { CocinaRealtimeBoard } from "@/components/cocina/cocina-realtime-board";
import { SectionTitle } from "@/components/ui/section-title";

export default async function CocinaPage() {
  const supabase = createClient();

  const { data: comandas } = await supabase
    .from("comandas")
    .select("id, pedido_id, estacion, estado, items, creada_en, pedidos(tipo, nombre_cliente, mesas(numero))")
    .not("estado", "in", "(lista,anulada)")
    .order("creada_en", { ascending: true })
    .limit(100);

  return (
    <div>
      <SectionTitle kanji="厨房" title="Cocina" className="mb-6" />
      <CocinaRealtimeBoard comandasIniciales={comandas ?? []} />
    </div>
  );
}
