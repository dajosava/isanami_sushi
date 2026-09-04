"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useNavigationLoading } from "@/components/providers/navigation-progress";
import { mensajeParaRuta } from "@/lib/navigation-loading-store";

/**
 * Fallback de Suspense (loading.tsx):
 * enciende/apaga el overlay unico (store global, sin remount del logo).
 */
export function RouteLoadingFallback({ message }: { message?: string }) {
  const pathname = usePathname();
  const { beginRouteLoad, endRouteLoad } = useNavigationLoading();
  const label = message ?? mensajeParaRuta(pathname);

  useEffect(() => {
    beginRouteLoad(label);
    return () => endRouteLoad();
  }, [beginRouteLoad, endRouteLoad, label]);

  return null;
}
