"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { marcarComandaLista } from "@/actions/comandas.actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { one } from "@/lib/relations";

interface ComandaItem {
  pedido_item_id?: string;
  producto?: string;
  cantidad?: number;
  notas?: string | null;
}

interface PedidoOrigen {
  tipo?: string;
  nombre_cliente?: string | null;
  mesas?: { numero: number } | { numero: number }[] | null;
}

interface Comanda {
  id: string;
  pedido_id?: string;
  estacion: string;
  estado: string;
  items: ComandaItem[] | unknown;
  creada_en: string;
  pedidos?: PedidoOrigen | PedidoOrigen[] | null;
}

const COMANDA_SELECT =
  "id, pedido_id, estacion, estado, items, creada_en, pedidos(tipo, nombre_cliente, mesas(numero))";

function parseItems(items: Comanda["items"]): ComandaItem[] {
  if (Array.isArray(items)) return items as ComandaItem[];
  return [];
}

function origenPedido(comanda: Comanda): string {
  const pedido = one(comanda.pedidos);
  if (!pedido) return "Origen desconocido";
  if (pedido.tipo === "para_llevar") {
    const nombre = pedido.nombre_cliente?.trim();
    return nombre ? `Para llevar · ${nombre}` : "Para llevar";
  }
  if (pedido.tipo === "delivery") {
    const nombre = pedido.nombre_cliente?.trim();
    return nombre ? `Delivery · ${nombre}` : "Delivery";
  }
  const mesa = one(pedido.mesas);
  if (mesa?.numero != null) return `Mesa ${mesa.numero}`;
  return "Salón";
}

export function CocinaRealtimeBoard({ comandasIniciales }: { comandasIniciales: Comanda[] }) {
  const [comandas, setComandas] = useState<Comanda[]>(comandasIniciales);
  const [pending, startTransition] = useTransition();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    async function enriquecerComanda(id: string): Promise<Comanda | null> {
      const { data } = await supabase
        .from("comandas")
        .select(COMANDA_SELECT)
        .eq("id", id)
        .maybeSingle();
      return (data as Comanda | null) ?? null;
    }

    const channel = supabase
      .channel("comandas-cocina")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comandas" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const nueva = await enriquecerComanda((payload.new as Comanda).id);
            if (nueva && nueva.estado !== "lista" && nueva.estado !== "anulada") {
              setComandas((prev) => [...prev.filter((c) => c.id !== nueva.id), nueva]);
            }
          } else if (payload.eventType === "UPDATE") {
            const parcial = payload.new as Comanda;
            if (parcial.estado === "lista" || parcial.estado === "anulada") {
              setComandas((prev) => prev.filter((c) => c.id !== parcial.id));
              return;
            }
            setComandas((prev) =>
              prev.map((c) => (c.id === parcial.id ? { ...c, ...parcial } : c))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  function marcarLista(comandaId: string) {
    startTransition(async () => {
      const result = await marcarComandaLista(comandaId);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Comanda marcada como lista", "exito");
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 pb-24 sm:grid-cols-2 lg:grid-cols-3 lg:pb-0">
      {comandas.map((comanda) => {
        const items = parseItems(comanda.items);
        return (
          <Card key={comanda.id} className="flex flex-col">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle>{comanda.estacion}</CardTitle>
                  <p className="mt-0.5 text-sm font-medium text-washi-50/90">
                    {origenPedido(comanda)}
                  </p>
                </div>
                <Badge tono="info">{comanda.estado}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="mb-3 flex-1 space-y-2 text-sm text-sumi-700">
                {items.map((item, idx) => (
                  <li key={item.pedido_item_id ?? idx}>
                    <span className="font-medium text-sumi-900">
                      {item.cantidad ?? 1}x {item.producto ?? "Producto"}
                    </span>
                    {item.notas ? (
                      <span className="mt-0.5 block text-xs">{item.notas}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => marcarLista(comanda.id)}
                className="min-h-11 w-full"
                disabled={pending}
              >
                Marcar lista
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {comandas.length === 0 && (
        <p className="col-span-full text-sm text-washi-50">No hay comandas pendientes.</p>
      )}
    </div>
  );
}
