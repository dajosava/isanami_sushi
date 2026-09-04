"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SectionTitle } from "@/components/ui/section-title";
import { kanjiMesa } from "@/components/ui/japanese-ornaments";
import { formatHoraCR } from "@/lib/utils";

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
  nombreCliente?: string | null;
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

export function PedidosMesasClient({
  mesas,
  pedidosParaLlevar,
}: {
  mesas: Mesa[];
  pedidosParaLlevar: PedidoParaLlevar[];
}) {
  return (
    <div className="space-y-10">
      <section>
        <SectionTitle
          kanji="持帰"
          title="Para llevar"
          actions={
            <Link
              href="/pedidos/para-llevar/nuevo"
              className="inline-flex w-full items-center justify-center rounded-md border border-gold/40 bg-gradient-to-b from-vermillion to-vermillion-deep px-4 py-2.5 text-sm font-medium text-washi shadow-lacquer transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(156,46,33,0.45)] xs:w-auto"
            >
              Nuevo pedido para llevar
            </Link>
          }
        />

        {pedidosParaLlevar.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pedidosParaLlevar.map((pedido) => (
              <Link
                key={pedido.id}
                href={`/pedidos/para-llevar/${pedido.id}`}
                className="isanami-mesa-card block p-4 pt-5"
              >
                <div className="relative z-[1] flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg text-washi">
                      {pedido.nombreCliente?.trim()
                        ? pedido.nombreCliente.trim()
                        : `Pedido ${formatHoraCR(pedido.creadoEn)}`}
                    </p>
                    <p className="mt-1 text-sm text-washi/75">
                      Para llevar · {pedido.items}{" "}
                      {pedido.items === 1 ? "producto" : "productos"}
                      {pedido.nombreCliente?.trim()
                        ? ` · ${formatHoraCR(pedido.creadoEn)}`
                        : ""}
                    </p>
                  </div>
                  <Badge tono={PEDIDO_TONO[pedido.estado as keyof typeof PEDIDO_TONO] ?? "neutro"}>
                    {pedido.estado}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="isanami-panel border border-gold/25 px-4 py-5">
            <p className="text-sm text-washi/70">
              No hay pedidos para llevar abiertos. Crea uno nuevo para empezar.
            </p>
          </div>
        )}
      </section>

      <section>
        <SectionTitle kanji="卓" title="Mesas" />
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {mesas.map((mesa) => (
            <Link
              key={mesa.id}
              href={`/pedidos/${mesa.id}`}
              className="isanami-mesa-card block p-4 pb-8 pt-5"
            >
              <div className="relative z-[1] flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg text-washi">Mesa {mesa.numero}</p>
                  <p className="mt-1 text-sm text-washi/75">
                    {mesa.zona ? `${mesa.zona} · ` : ""}
                    {mesa.capacidad} personas
                  </p>
                </div>
                <Badge tono={ESTADO_TONO[mesa.estado as keyof typeof ESTADO_TONO] ?? "neutro"}>
                  {mesa.estado}
                </Badge>
              </div>
              <span className="isanami-hanko" aria-hidden>
                {kanjiMesa(mesa.numero)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
