import { redirect } from "next/navigation";

export default function FacturacionNuevaRedirect({
  params,
}: {
  params: { pedidoId: string };
}) {
  redirect(`/ventas/nueva/${params.pedidoId}`);
}
