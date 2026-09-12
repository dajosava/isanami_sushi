"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export function IsanamiLogoLoader({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "sm" ? "w-16" : size === "lg" ? "w-40 sm:w-44" : "w-28 sm:w-32";

  return (
    <div className={cn("animate-logo-pulse", className)}>
      <div className="overflow-hidden rounded-full border-2 border-washi/80 shadow-[0_0_0_2px_rgba(200,64,47,0.3)]">
        <Image
          src="/isanami-logo.png"
          alt=""
          width={320}
          height={320}
          className={cn("h-auto drop-shadow-[0_8px_32px_rgba(156,46,33,0.45)]", sizeClass)}
          priority
        />
      </div>
    </div>
  );
}

/** Pantalla completa con logo Isanami (sin particulas). */
export function AppTransitionOverlay({
  message = "Cargando...",
}: {
  message?: string;
}) {
  return (
    <div
      className="bg-isanami-sumi !fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden"
      style={{ position: "fixed", inset: 0, zIndex: 99999 }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="mb-6 animate-logo-enter">
          <IsanamiLogoLoader size="lg" className="!animate-none" />
        </div>

        <p className="mb-1 font-display text-[11px] tracking-[0.28em] text-gold-dim">待</p>
        <p className="animate-fade-up font-display text-base font-medium tracking-wide text-washi sm:text-lg">
          {message}
        </p>

        <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-washi/15 sm:w-56">
          <div className="h-full w-1/3 animate-shimmer-bar rounded-full bg-gradient-to-r from-transparent via-vermillion to-transparent" />
        </div>

        <div className="mt-6 flex gap-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce-dot rounded-full bg-gold"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(18,10,13,0.55)_100%)]" />
    </div>
  );
}
