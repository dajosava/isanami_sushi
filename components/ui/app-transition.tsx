"use client";

import Image from "next/image";
import { useMemo } from "react";

function TransitionPetals() {
  const petals = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${(i * 7.3 + 2) % 100}%`,
        delay: `${(i % 7) * 0.45}s`,
        duration: `${6 + (i % 5)}s`,
        size: 7 + (i % 4) * 2,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 animate-petal-fall rounded-full bg-sakura-300/75 shadow-[0_0_6px_rgba(201,75,102,0.4)]"
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

export function AppTransitionOverlay({
  message = "Entrando al sistema...",
}: {
  message?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[300] flex animate-fade-in flex-col items-center justify-center overflow-hidden bg-isanami-sakura"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(255,201,212,0.3) 0%, transparent 40%), radial-gradient(circle at 70% 80%, rgba(201,75,102,0.35) 0%, transparent 45%)",
        }}
        aria-hidden
      />

      <TransitionPetals />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="animate-logo-enter mb-6">
          <Image
            src="/isanami-logo.png"
            alt=""
            width={320}
            height={320}
            className="h-auto w-36 drop-shadow-[0_8px_32px_rgba(255,77,58,0.45)] sm:w-44"
            priority
          />
        </div>

        <p className="animate-fade-up text-base font-medium tracking-wide text-washi-50 sm:text-lg">
          {message}
        </p>

        <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-white/15 sm:w-56">
          <div className="h-full w-1/3 animate-shimmer-bar rounded-full bg-gradient-to-r from-transparent via-[#FF4D3A] to-transparent" />
        </div>

        <div className="mt-6 flex gap-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce-dot rounded-full bg-sakura-300"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(18,8,10,0.5)_100%)]" />
    </div>
  );
}
