import { unstable_cache } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const CONFIG_CACHE_TAG = "restaurante-config";

export type RestauranteConfig = {
  nombre_comercial: string;
  cedula_juridica: string | null;
  telefono: string | null;
  email_facturacion: string | null;
  provincia: string | null;
  canton: string | null;
  distrito: string | null;
  senas_exactas: string | null;
};

async function fetchRestauranteConfig(): Promise<RestauranteConfig | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("restaurante_config")
    .select(
      "nombre_comercial, cedula_juridica, telefono, email_facturacion, provincia, canton, distrito, senas_exactas"
    )
    .limit(1)
    .maybeSingle();
  return data;
}

export const getRestauranteConfig = unstable_cache(fetchRestauranteConfig, ["restaurante-config"], {
  revalidate: 600,
  tags: [CONFIG_CACHE_TAG],
});
