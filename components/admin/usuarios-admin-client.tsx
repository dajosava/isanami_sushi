"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actualizarUsuario, crearUsuario } from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { LoadingOverlay } from "@/components/ui/page-loader";
import { EditIconButton } from "@/components/ui/edit-icon-button";
import type { Rol } from "@/lib/auth/roles";

interface Usuario {
  id: string;
  nombre: string;
  rol: string;
  activo: boolean;
}

const ROLES = ["admin", "gerente", "mesero", "cocina", "cajero", "contador"] as const;

export function UsuariosAdminClient({
  usuarios,
  usuarioActualId,
}: {
  usuarios: Usuario[];
  usuarioActualId: string;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<string>("mesero");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editRol, setEditRol] = useState<string>("mesero");
  const [editActivo, setEditActivo] = useState(true);

  function crear() {
    startTransition(async () => {
      const result = await crearUsuario({ nombre, email, password, rol });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Usuario creado", "exito");
      setNombre("");
      setEmail("");
      setPassword("");
      router.refresh();
    });
  }

  function empezarEdicion(u: Usuario) {
    setEditId(u.id);
    setEditNombre(u.nombre);
    setEditRol(u.rol);
    setEditActivo(u.activo);
  }

  function cancelarEdicion() {
    setEditId(null);
  }

  function guardarEdicion() {
    if (!editId) return;
    const nombreLimpio = editNombre.trim();
    if (nombreLimpio.length < 2) {
      toast("El nombre debe tener al menos 2 caracteres", "peligro");
      return;
    }

    if (editId === usuarioActualId && !editActivo) {
      toast("No puedes desactivar tu propia cuenta", "peligro");
      return;
    }

    startTransition(async () => {
      const result = await actualizarUsuario({
        id: editId,
        nombre: nombreLimpio,
        rol: editRol as Rol,
        activo: editActivo,
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Usuario actualizado", "exito");
      setEditId(null);
      router.refresh();
    });
  }

  function toggleActivoRapido(u: Usuario) {
    if (u.id === usuarioActualId && u.activo) {
      toast("No puedes desactivar tu propia cuenta", "peligro");
      return;
    }

    const nuevoEstado = !u.activo;
    const msg = nuevoEstado
      ? `¿Reactivar a ${u.nombre}?`
      : `¿Desactivar temporalmente a ${u.nombre}? No podrá iniciar sesión.`;
    if (!window.confirm(msg)) return;

    startTransition(async () => {
      const result = await actualizarUsuario({
        id: u.id,
        nombre: u.nombre,
        rol: u.rol as Rol,
        activo: nuevoEstado,
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast(nuevoEstado ? "Usuario reactivado" : "Usuario desactivado", "exito");
      if (editId === u.id) setEditActivo(nuevoEstado);
      router.refresh();
    });
  }

  return (
    <>
      {pending ? <LoadingOverlay label="Guardando usuario..." /> : null}
      <div className="space-y-3">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Nuevo usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Contrasena temporal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Select value={rol} onChange={(e) => setRol(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <Button onClick={crear} disabled={pending || !nombre || !email || !password}>
              Crear usuario
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-x-auto">
          <CardHeader>
            <CardTitle>Usuarios del sistema</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="isanami-table w-full text-sm">
              <thead className="text-left">
                <tr>
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">Rol</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const editando = editId === u.id;
                  return (
                    <tr key={u.id} className="border-b border-washi-200">
                      <td className="px-4 py-2">
                        {editando ? (
                          <Input
                            value={editNombre}
                            onChange={(e) => setEditNombre(e.target.value)}
                            maxLength={80}
                            className="min-w-[10rem]"
                          />
                        ) : (
                          u.nombre
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {editando ? (
                          <Select
                            value={editRol}
                            onChange={(e) => setEditRol(e.target.value)}
                            className="min-w-[8rem]"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Badge tono="info">{u.rol}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {editando ? (
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editActivo}
                              onChange={(e) => setEditActivo(e.target.checked)}
                              disabled={u.id === usuarioActualId}
                            />
                            {editActivo ? "Activo" : "Inactivo"}
                          </label>
                        ) : (
                          <Badge tono={u.activo ? "exito" : "neutro"}>
                            {u.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {editando ? (
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" onClick={guardarEdicion} disabled={pending}>
                              Guardar
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={cancelarEdicion}
                              disabled={pending}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <EditIconButton
                              onClick={() => empezarEdicion(u)}
                              label={`Editar ${u.nombre}`}
                            />
                            <button
                              type="button"
                              className="text-sm text-sumi-600 underline-offset-2 hover:underline"
                              onClick={() => toggleActivoRapido(u)}
                              disabled={u.id === usuarioActualId && u.activo}
                            >
                              {u.activo ? "Desactivar" : "Reactivar"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
