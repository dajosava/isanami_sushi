"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
        stroke="#2a1810"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M168 280 C210 250 250 230 280 180"
        fill="none"
        stroke="#2a1810"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M168 240 C130 210 90 195 55 150"
        fill="none"
        stroke="#2a1810"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M168 190 C200 160 215 120 230 85"
        fill="none"
        stroke="#2a1810"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {[
        [95, 70], [130, 55], [160, 45], [190, 60], [70, 110],
        [110, 95], [150, 85], [200, 95], [240, 80], [45, 145],
        [85, 140], [125, 130], [175, 125], [220, 120], [265, 155],
        [250, 175], [210, 165], [60, 175], [100, 165], [145, 155],
      ].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx} ${cy})`}>
          <circle r="16" fill="#c94b66" opacity="0.92" />
          <circle r="10" fill="#ffc9d4" opacity="0.55" cx="4" cy="-3" />
          <circle r="4" fill="#fff5f5" opacity="0.7" cx="-2" cy="2" />
        </g>
      ))}
    </svg>
  );
}

function FallingPetals() {
  const petals = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${(i * 5.7 + 3) % 100}%`,
        delay: `${(i % 9) * 0.7}s`,
        duration: `${9 + (i % 6)}s`,
        size: 8 + (i % 5) * 2,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 animate-petal-fall rounded-full bg-sakura-300/80 shadow-[0_0_8px_rgba(201,75,102,0.35)]"
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 0.7,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
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

    setEntering(true);
    router.push("/pedidos");
    router.refresh();
  }

  return (
    <>
      {entering && <AppTransitionOverlay message="Bienvenido a Isanami" />}

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Fondo: tinta + rojo hinomaru / sakura */}
      <div className="bg-isanami-sakura absolute inset-0" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(255,201,212,0.25) 0%, transparent 35%), radial-gradient(circle at 80% 70%, rgba(201,75,102,0.35) 0%, transparent 40%)",
        }}
      />

      {/* Arboles de cerezo */}
      <SakuraTree className="pointer-events-none absolute bottom-0 left-[-2%] hidden h-[88vh] w-auto origin-bottom animate-soft-sway opacity-90 md:block" />
      <SakuraTree
        flip
        className="pointer-events-none absolute bottom-0 right-[-2%] hidden h-[88vh] w-auto origin-bottom animate-soft-sway opacity-90 md:block"
      />
      {/* Version movil: arboles mas bajos */}
      <SakuraTree className="pointer-events-none absolute bottom-0 left-[-18%] h-[55vh] w-auto opacity-70 md:hidden" />
      <SakuraTree
        flip
        className="pointer-events-none absolute bottom-0 right-[-18%] h-[55vh] w-auto opacity-70 md:hidden"
      />

      <FallingPetals />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(18,8,10,0.55)_100%)]" />

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="overflow-hidden rounded-xl border border-sakura-300/40 bg-washi-50/95 shadow-[0_24px_60px_rgba(80,16,24,0.45)] backdrop-blur-sm">
          <div className="h-1.5 w-full bg-gradient-to-r from-umeboshi-700 via-sakura-500 to-umeboshi-600" />

          <div className="px-8 pb-8 pt-7">
            <div className="mb-6 flex flex-col items-center text-center">
              <Image
                src="/isanami-logo.png"
                alt="Isanami Sushi"
                width={448}
                height={448}
                className="mb-3 h-auto w-48 drop-shadow-sm"
                priority
              />
              <p className="text-sm text-sumi-700">Acceso al sistema interno</p>
              <p className="mt-1 text-xs tracking-[0.18em] text-sakura-600/90 uppercase">
                Sakura · Hojancha
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-sumi-800">
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-sakura-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sakura-500 focus:ring-2 focus:ring-sakura-300/60"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-sumi-800">
                  Contrasena
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-sakura-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sakura-500 focus:ring-2 focus:ring-sakura-300/60"
                />
              </div>

              {error && <p className="text-sm text-umeboshi-500">{error}</p>}

              <button
                type="submit"
                disabled={loading || entering}
                className="w-full rounded-md bg-[#FF4D3A] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(255,77,58,0.45)] transition hover:bg-[#FF3B26] hover:shadow-[0_10px_28px_rgba(255,59,38,0.55)] disabled:opacity-60"
              >
                {entering ? "Entrando..." : loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
