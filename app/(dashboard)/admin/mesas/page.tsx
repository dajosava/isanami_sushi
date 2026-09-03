import { createClient } from "@/lib/supabase/server";
import { MesasAdminClient } from "@/components/admin/mesas-admin-client";

export default async function MesasAdminPage() {
  const supabase = createClient();
  const { data: mesas } = await supabase
    .from("mesas")
    .select("id, numero, zona, capacidad, estado")
    .order("numero");

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Mesas</h1>
      <MesasAdminClient mesas={mesas ?? []} />
    </div>
  );
}
