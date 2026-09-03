import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Rol } from "@/lib/auth/roles";

export type UsuarioActual = {
  id: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
};

export const ROLES_ANALITICA: Rol[] = ["admin", "gerente", "contador"];

/** Una sola consulta auth+usuario por request (deduplicada entre layout y páginas). */
export const getUsuarioActual = cache(async (): Promise<UsuarioActual | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, nombre, rol, activo")
    .eq("id", user.id)
    .single();

  if (!usuario) return null;
  return { ...usuario, rol: usuario.rol as Rol };
});

export async function requireUsuarioActual(): Promise<UsuarioActual> {
  const usuario = await getUsuarioActual();
  if (!usuario?.activo) redirect("/login");
  return usuario;
}

export async function requireRolAnalitica(): Promise<UsuarioActual> {
  const usuario = await requireUsuarioActual();
  if (!ROLES_ANALITICA.includes(usuario.rol)) redirect("/pedidos");
  return usuario;
}

export function puedeVerAnalitica(rol: Rol): boolean {
  return ROLES_ANALITICA.includes(rol);
}
