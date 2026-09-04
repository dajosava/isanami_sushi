"use client";

import { useEffect } from "react";
import { AppTransitionOverlay, IsanamiLogoLoader } from "@/components/ui/app-transition";
import { useNavigationLoading } from "@/components/providers/navigation-progress";

/** Carga inline (dentro de una pagina). */
export function PageLoader({ label = "Cargando..." }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <IsanamiLogoLoader size="md" />
      <p className="text-sm text-washi/85">{label}</p>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-washi/15">
        <div className="h-full w-1/3 animate-shimmer-bar rounded-full bg-gradient-to-r from-transparent via-vermillion to-transparent" />
      </div>
    </div>
  );
}

/**
 * Overlay a pantalla completa — misma animacion que al abrir mesas.
 * Dentro del dashboard reutiliza el overlay unico del NavigationLoadingProvider
 * (sin remount / reinicio del logo).
 */
export function LoadingOverlay({ label = "Cargando..." }: { label?: string }) {
  const { ready, beginRouteLoad, endRouteLoad } = useNavigationLoading();

  useEffect(() => {
    if (!ready) return;
    beginRouteLoad(label);
    return () => endRouteLoad();
  }, [ready, label, beginRouteLoad, endRouteLoad]);

  if (!ready) {
    return <AppTransitionOverlay message={label} />;
  }

  return null;
}
