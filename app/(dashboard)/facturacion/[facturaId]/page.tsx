import { redirect } from "next/navigation";

export default function FacturacionDetalleRedirect({
  params,
}: {
  params: { facturaId: string };
}) {
  redirect(`/ventas/${params.facturaId}`);
}
