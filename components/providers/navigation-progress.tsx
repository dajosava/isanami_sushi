"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  beginRouteLoad as storeBegin,
  endRouteLoad as storeEnd,
  esNavegacionInterna,
  getNavLoadingServerSnapshot,
  getNavLoadingSnapshot,
  mensajeParaRuta,
  onPathnameChanged,
  startNavLoading,
  subscribeNavLoading,
} from "@/lib/navigation-loading-store";

export { mensajeParaRuta };

type Ctx = {
  ready: boolean;
  navegando: boolean;
  start: (message?: string, destinoPathname?: string) => void;
  beginRouteLoad: (message?: string) => void;
  endRouteLoad: () => void;
};

const NavigationLoadingContext = createContext<Ctx>({
  ready: false,
  navegando: false,
  start: () => undefined,
  beginRouteLoad: () => undefined,
  endRouteLoad: () => undefined,
});

export function useNavigationLoading() {
  return useContext(NavigationLoadingContext);
}

/**
 * Overlay de transicion via DOM imperativo (#isanami-transition-overlay).
 * No depende de portals/Suspense de React.
 */
export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const snap = useSyncExternalStore(
    subscribeNavLoading,
    getNavLoadingSnapshot,
    getNavLoadingServerSnapshot
  );

  const start = useCallback((message?: string, destinoPathname?: string) => {
    startNavLoading(message, destinoPathname);
  }, []);

  const beginRouteLoad = useCallback((message?: string) => {
    storeBegin(message);
  }, []);

  const endRouteLoad = useCallback(() => {
    storeEnd();
  }, []);

  // Clics en cualquier Link interno (capture, antes de Next)
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (!esNavegacionInterna(anchor, pathname)) return;

      try {
        const destino = new URL(anchor.href, window.location.origin);
        startNavLoading(mensajeParaRuta(destino.pathname), destino.pathname);
      } catch {
        startNavLoading();
      }
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  useEffect(() => {
    function onPopState() {
      startNavLoading("Cargando...");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    // Incluye el montaje inicial (p. ej. llegada desde login con overlay ya visible)
    onPathnameChanged(pathname);
    prevPath.current = pathname;
  }, [pathname]);

  const value = useMemo(
    () => ({
      ready: true as const,
      navegando: snap.visible,
      start,
      beginRouteLoad,
      endRouteLoad,
    }),
    [snap.visible, start, beginRouteLoad, endRouteLoad]
  );

  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
    </NavigationLoadingContext.Provider>
  );
}
