"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Mesa {
  id: string;
  numero: number;
  zona: string | null;
  capacidad: number;
  estado: string;
}

interface PedidoParaLlevar {
  id: string;
  estado: string;
  creadoEn: string;
  items: number;
}

const ESTADO_TONO = {
  libre: "exito",
  ocupada: "peligro",
  reservada: "info",
  en_cuenta: "advertencia",
} as const;

const PEDIDO_TONO = {
  abierto: "info",
  enviado: "advertencia",
  en_preparacion: "advertencia",
  servido: "exito",
} as const;

function formatearHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PedidosMesasClient({
  mesas,
  pedidosParaLlevar,
}: {
  mesas: Mesa[];
  pedidosParaLlevar: PedidoParaLlevar[];
}) {
  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-washi-50">Para llevar</h2>
          <Link
            href="/pedidos/para-llevar/nuevo"
            className="inline-flex w-full items-center justify-center rounded-md bg-[#FF4D3A] px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_14px_rgba(255,77,58,0.35)] hover:opacity-90 xs:w-auto"
          >
            Nuevo pedido para llevar
          </Link>
        </div>

        {pedidosParaLlevar.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pedidosParaLlevar.map((pedido) => (
              <Card key={pedido.id} className="transition hover:border-sakura-400">
                <Link href={`/pedidos/para-llevar/${pedido.id}`} className="block">
                  <CardHeader className="mb-0">
                    <CardTitle>Pedido {formatearHora(pedido.creadoEn)}</CardTitle>
                    <Badge tono={PEDIDO_TONO[pedido.estado as keyof typeof PEDIDO_TONO] ?? "neutro"}>
                      {pedido.estado}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm font-medium text-sumi-900">
                      {pedido.items} {pedido.items === 1 ? "producto" : "productos"}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-washi-50/80">
            No hay pedidos para llevar abiertos. Crea uno nuevo para empezar.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-washi-50">Mesas</h2>
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {mesas.map((mesa) => (
            <Card key={mesa.id} className="flex h-full flex-col transition hover:border-sakura-400">
              <Link href={`/pedidos/${mesa.id}`} className="block flex-1">
                <CardHeader className="mb-0">
                  <CardTitle>Mesa {mesa.numero}</CardTitle>
                  <Badge tono={ESTADO_TONO[mesa.estado as keyof typeof ESTADO_TONO] ?? "neutro"}>
                    {mesa.estado}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-sumi-800">
                    {mesa.zona ? `${mesa.zona} · ` : ""}
                    {mesa.capacidad} personas
                  </p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
