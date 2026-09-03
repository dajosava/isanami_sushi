"use client";

import { useState, useTransition } from "react";
import { crearUsuario } from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

interface Usuario {
  id: string;
  nombre: string;
  rol: string;
  activo: boolean;
}

const ROLES = ["admin", "gerente", "mesero", "cocina", "cajero"] as const;

export function UsuariosAdminClient({ usuarios }: { usuarios: Usuario[] }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<string>("mesero");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

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
    });
  }

  return (
    <div className="space-y-3">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Nuevo usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
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
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-washi-200">
                  <td className="px-4 py-2">{u.nombre}</td>
                  <td className="px-4 py-2">
                    <Badge tono="info">{u.rol}</Badge>
                  </td>
                  <td className="px-4 py-2">{u.activo ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
