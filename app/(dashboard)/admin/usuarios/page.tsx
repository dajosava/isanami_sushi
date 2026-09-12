import { createClient } from "@/lib/supabase/server";
import { requireUsuarioActual } from "@/lib/auth/usuario";
import { UsuariosAdminClient } from "@/components/admin/usuarios-admin-client";
import type { Rol } from "@/lib/auth/roles";

export default async function UsuariosPage() {
  const actual = await requireUsuarioActual();
  if (actual.rol !== "admin") {
    return (
      <div>
        <h1 className="mb-4 font-display text-2xl">Usuarios</h1>
        <p className="text-sm text-washi/80">Solo el administrador puede gestionar usuarios.</p>
      </div>
    );
  }

  const supabase = createClient();
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nombre, rol, activo")
    .order("nombre");

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl">Usuarios</h1>
      <p className="mb-6 text-sm text-washi/75">
        Edita nombres, roles y desactiva cuentas temporalmente (no podrán iniciar sesión).
      </p>
      <UsuariosAdminClient
        usuarioActualId={actual.id}
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
