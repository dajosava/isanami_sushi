"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingOverlay } from "@/components/ui/page-loader";

function esNavegacionInterna(anchor: HTMLAnchorElement, pathname: string) {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || anchor.target === "_blank") return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;

  try {
    const destino = new URL(href, window.location.origin);
    if (destino.origin !== window.location.origin) return false;
    if (destino.pathname === pathname && !destino.search) return false;
    return true;
  } catch {
    return false;
  }
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navegando, setNavegando] = useState(false);

  useEffect(() => {
    setNavegando(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor || !esNavegacionInterna(anchor, pathname)) return;
      setNavegando(true);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  if (!navegando) return null;
  return <LoadingOverlay label="Cargando página..." />;
}
