import { redirect } from "next/navigation";

/** Redirección temporal: Facturación pasó a llamarse Ventas. */
export default function FacturacionRedirect({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (typeof value === "string") params.set(key, value);
  }
  const qs = params.toString();
  redirect(qs ? `/ventas?${qs}` : "/ventas");
}
