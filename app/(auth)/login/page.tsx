"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { startNavLoading } from "@/lib/navigation-loading-store";
import { AppTransitionOverlay } from "@/components/ui/app-transition";

function SakuraTree({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 320 520"
      className={className}
      aria-hidden
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M168 520 V210 C168 170 150 140 130 110 C110 85 105 55 120 40"
        fill="none"
        stroke="#8a743f"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M168 280 C210 250 250 230 280 180"
        fill="none"
        stroke="#8a743f"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M168 240 C130 210 90 195 55 150"
        fill="none"
        stroke="#8a743f"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M168 190 C200 160 215 120 230 85"
        fill="none"
        stroke="#8a743f"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {[
        [95, 70], [130, 55], [160, 45], [190, 60], [70, 110],
        [110, 95], [150, 85], [200, 95], [240, 80], [45, 145],
        [85, 140], [125, 130], [175, 125], [220, 120], [265, 155],
        [250, 175], [210, 165], [60, 175], [100, 165], [145, 155],
      ].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx} ${cy})`}>
          <circle r="14" fill="#eec3cc" opacity="0.88" />
          <circle r="8" fill="#dc8fa0" opacity="0.55" cx="3" cy="-2" />
        </g>
      ))}
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setError("Correo o contrasena incorrectos.");
      return;
    }

    // Overlay DOM primero (sobrevive al desmontar login), luego solo animacion
    startNavLoading("Cargando...", "/pedidos");
    setEntering(true);
    router.push("/pedidos");
    router.refresh();
  }

  // Solo animacion a pantalla completa — nunca formulario + loader juntos
  if (entering || loading) {
    return <AppTransitionOverlay message={entering ? "Cargando..." : "Ingresando..."} />;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="bg-isanami-sumi absolute inset-0" />

      <SakuraTree className="pointer-events-none absolute bottom-0 left-[-2%] hidden h-[88vh] w-auto origin-bottom opacity-80 md:block" />
      <SakuraTree
        flip
        className="pointer-events-none absolute bottom-0 right-[-2%] hidden h-[88vh] w-auto origin-bottom opacity-80 md:block"
      />
      <SakuraTree className="pointer-events-none absolute bottom-0 left-[-18%] h-[55vh] w-auto opacity-55 md:hidden" />
      <SakuraTree
        flip
        className="pointer-events-none absolute bottom-0 right-[-18%] h-[55vh] w-auto opacity-55 md:hidden"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(18,10,13,0.6)_100%)]" />

      <div className="relative z-10 w-full max-w-sm animate-fade-up px-2">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 overflow-hidden rounded-full border-[3px] border-washi/90 shadow-[0_0_0_2px_rgba(200,64,47,0.35)]">
            <Image
              src="/isanami-logo.png"
              alt="Isanami Sushi"
              width={448}
              height={448}
              className="h-auto w-48 drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)] sm:w-52"
              priority
            />
          </div>
          <p className="font-display text-[11px] tracking-[0.28em] text-gold-dim">入場</p>
          <p className="mt-1 text-sm text-washi/90">Acceso al sistema interno</p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
            Hojancha · Guanacaste
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-washi">
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gold/30 bg-washi/10 px-3 py-2.5 text-sm text-washi outline-none backdrop-blur-[2px] transition placeholder:text-washi/40 focus:border-gold/60 focus:bg-washi/15 focus:ring-2 focus:ring-gold/25"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-washi">
              Contrasena
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gold/30 bg-washi/10 px-3 py-2.5 text-sm text-washi outline-none backdrop-blur-[2px] transition placeholder:text-washi/40 focus:border-gold/60 focus:bg-washi/15 focus:ring-2 focus:ring-gold/25"
            />
          </div>

          {error ? (
            <p className="rounded-md border border-vermillion/40 bg-vermillion/15 px-3 py-2 text-sm text-sakura">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || entering}
            className="w-full rounded-md border border-gold/40 bg-gradient-to-b from-vermillion to-vermillion-deep px-4 py-2.5 text-sm font-medium text-washi shadow-lacquer transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(156,46,33,0.45)] disabled:opacity-60"
          >
            Ingresar
          </button>
        </form>
      </div>
    </main>
  );
}
