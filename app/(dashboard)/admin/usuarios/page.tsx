import { createClient } from "@/lib/supabase/server";
import { UsuariosAdminClient } from "@/components/admin/usuarios-admin-client";
import type { Rol } from "@/lib/auth/roles";

export default async function UsuariosPage() {
  const supabase = createClient();
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nombre, rol, activo")
    .order("nombre");

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Usuarios</h1>
      <UsuariosAdminClient
        usuarios={(usuarios ?? []).map((u) => ({
          id: u.id,
          nombre: u.nombre,
          rol: u.rol as Rol,
          activo: u.activo,
        }))}
      />
    </div>
  );
}
