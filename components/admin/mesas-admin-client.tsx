"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { guardarMesa, eliminarMesa } from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

interface Mesa {
  id: string;
  numero: number;
  zona: string | null;
  capacidad: number;
  estado: string;
}

const ESTADO_TONO = {
  libre: "exito",
  ocupada: "peligro",
  reservada: "info",
  en_cuenta: "advertencia",
} as const;

export function MesasAdminClient({ mesas }: { mesas: Mesa[] }) {
  const [numero, setNumero] = useState("");
  const [capacidad, setCapacidad] = useState("4");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function crear() {
    startTransition(async () => {
      const result = await guardarMesa({
        numero: Number(numero),
        capacidad: Number(capacidad),
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Mesa creada", "exito");
      setNumero("");
      setCapacidad("4");
    });
  }

  function eliminar(id: string, n: number) {
    if (!confirm(`¿Eliminar la mesa ${n}? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      const result = await eliminarMesa(id);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Mesa eliminada", "exito");
    });
  }

  return (
    <div className="space-y-3">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Nueva mesa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="number"
            placeholder="Numero de mesa"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Capacidad"
            value={capacidad}
            onChange={(e) => setCapacidad(e.target.value)}
          />
          <Button onClick={crear} disabled={pending || !numero}>
            Crear mesa
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Mesas registradas</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="isanami-table w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-2">Numero</th>
                <th className="px-4 py-2">Zona</th>
                <th className="px-4 py-2">Capacidad</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mesas.map((m) => (
                <tr key={m.id} className="border-b border-washi-200">
                  <td className="px-4 py-2">{m.numero}</td>
                  <td className="px-4 py-2">{m.zona ?? "—"}</td>
                  <td className="px-4 py-2">{m.capacidad}</td>
                  <td className="px-4 py-2">
                    <Badge tono={ESTADO_TONO[m.estado as keyof typeof ESTADO_TONO] ?? "neutro"}>
                      {m.estado}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-sakura-600 hover:bg-sakura-50 hover:text-sakura-700"
                      onClick={() => eliminar(m.id, m.numero)}
                      disabled={pending}
                      title="Eliminar mesa"
                      aria-label={`Eliminar mesa ${m.numero}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
