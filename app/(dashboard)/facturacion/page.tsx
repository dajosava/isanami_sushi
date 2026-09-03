import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FacturacionLista } from "@/components/facturacion/facturacion-lista";

export default async function FacturacionPage() {
  const supabase = createClient();
  const { data: comprobantes } = await supabase
    .from("facturas")
    .select("id, numero_comprobante, fecha_emision, total_comprobante, estado, medio_pago")
    .order("fecha_emision", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="mb-4 font-display text-xl text-washi-50 sm:mb-6 sm:text-2xl">
        Comprobantes de cobro
      </h1>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Comprobantes recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <FacturacionLista comprobantes={comprobantes ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
