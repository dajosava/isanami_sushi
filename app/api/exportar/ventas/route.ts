import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual, puedeVerAnalitica } from "@/lib/auth/usuario";

const MAX_REGISTROS = 2000;

/**
 * Exporta el detalle de ventas (comprobantes internos) de un rango de fechas
 * en JSON, para que el sistema de facturacion fiscal externo del cliente
 * (o su contador) lo tome como insumo.
 *
 * GET /api/exportar/ventas?desde=2026-07-01&hasta=2026-07-15
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  if (!desde || !hasta) {
    return NextResponse.json(
      { error: "Los parametros 'desde' y 'hasta' son requeridos (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const usuario = await getUsuarioActual();
  if (!usuario || !puedeVerAnalitica(usuario.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = createClient();
  const hastaExclusivo = `${hasta}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from("facturas")
    .select(
      "numero_comprobante, fecha_emision, subtotal, total_impuesto, total_comprobante, medio_pago, estado, exportado_a_facturacion_fiscal"
    )
    .gte("fecha_emision", desde)
    .lte("fecha_emision", hastaExclusivo)
    .order("fecha_emision")
    .limit(MAX_REGISTROS);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    desde,
    hasta,
    total_registros: data?.length ?? 0,
    limite_aplicado: MAX_REGISTROS,
    ventas: data,
  });
}
