/**
 * Transicion de navegacion con overlay DOM imperativo.
 * No depende de re-renders de React (evita overlays invisibles por batching/Suspense).
 */

export type NavLoadingSnapshot = {
  visible: boolean;
  message: string;
};

type Internal = {
  visible: boolean;
  message: string;
  routeDepth: number;
  clickActivo: boolean;
  rutaOrigen: string | null;
  mostradoDesde: number;
  hideTimer: ReturnType<typeof setTimeout> | null;
  safetyTimer: ReturnType<typeof setTimeout> | null;
};

const OVERLAY_ID = "isanami-transition-overlay";
const MIN_VISIBLE_MS = 900;
const SAFETY_MS = 15_000;

const state: Internal = {
  visible: false,
  message: "Cargando...",
  routeDepth: 0,
  clickActivo: false,
  rutaOrigen: null,
  mostradoDesde: 0,
  hideTimer: null,
  safetyTimer: null,
};

const listeners = new Set<() => void>();

let snapshot: NavLoadingSnapshot = {
  visible: false,
  message: "Cargando...",
};

const SERVER_SNAPSHOT: NavLoadingSnapshot = {
  visible: false,
  message: "Cargando...",
};

function emit() {
  snapshot = { visible: state.visible, message: state.message };
  listeners.forEach((l) => l());
}

export function subscribeNavLoading(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNavLoadingSnapshot(): NavLoadingSnapshot {
  return snapshot;
}

export function getNavLoadingServerSnapshot(): NavLoadingSnapshot {
  return SERVER_SNAPSHOT;
}

function clearHideTimer() {
  if (state.hideTimer) {
    clearTimeout(state.hideTimer);
    state.hideTimer = null;
  }
}

function clearSafetyTimer() {
  if (state.safetyTimer) {
    clearTimeout(state.safetyTimer);
    state.safetyTimer = null;
  }
}

function armSafety() {
  clearSafetyTimer();
  state.safetyTimer = setTimeout(() => {
    state.routeDepth = 0;
    state.clickActivo = false;
    state.rutaOrigen = null;
    state.mostradoDesde = 0;
    state.visible = false;
    state.safetyTimer = null;
    syncDom(false);
    emit();
  }, SAFETY_MS);
}

function syncDom(visible: boolean) {
  if (typeof document === "undefined") return;

  let el = document.getElementById(OVERLAY_ID);
  if (!visible) {
    if (el) {
      el.dataset.visible = "0";
      el.style.display = "none";
    }
    return;
  }

  if (!el) {
    el = document.createElement("div");
    el.id = OVERLAY_ID;
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-busy", "true");
    el.innerHTML = `
      <div class="isanami-transition-inner">
        <div class="isanami-transition-logo-wrap">
          <img src="/isanami-logo.png" alt="" width="176" height="176" class="isanami-transition-logo" />
        </div>
        <p class="isanami-transition-kanji">待</p>
        <p class="isanami-transition-msg"></p>
        <div class="isanami-transition-bar"><span></span></div>
        <div class="isanami-transition-dots" aria-hidden="true">
          <i></i><i></i><i></i>
        </div>
      </div>
    `;
    document.body.appendChild(el);
  }

  // Estilos inline por si el CSS aun no aplica / conflicto de position
  Object.assign(el.style, {
    position: "fixed",
    inset: "0",
    top: "0",
    right: "0",
    bottom: "0",
    left: "0",
    width: "100vw",
    height: "100dvh",
    minHeight: "100vh",
    zIndex: "99999",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  });

  const msg = el.querySelector(".isanami-transition-msg");
  if (msg) msg.textContent = state.message;
  el.setAttribute("aria-label", state.message);
  el.dataset.visible = "1";
}

function show(message: string) {
  clearHideTimer();
  state.message = message;
  state.visible = true;
  if (!state.mostradoDesde) state.mostradoDesde = Date.now();
  armSafety();
  syncDom(true);
  emit();
}

function scheduleHide() {
  clearHideTimer();
  const elapsed = Date.now() - (state.mostradoDesde || Date.now());
  const wait = Math.max(200, MIN_VISIBLE_MS - elapsed);

  state.hideTimer = setTimeout(() => {
    if (state.routeDepth > 0 || state.clickActivo) return;
    state.visible = false;
    state.mostradoDesde = 0;
    state.rutaOrigen = null;
    state.hideTimer = null;
    clearSafetyTimer();
    syncDom(false);
    emit();
  }, wait);
}

export function mensajeParaRuta(pathname: string): string {
  if (pathname.startsWith("/pedidos/para-llevar")) return "Cargando pedido para llevar...";
  if (/^\/pedidos\/[^/]+$/.test(pathname)) return "Cargando mesa...";
  if (pathname.startsWith("/pedidos")) return "Cargando pedidos...";
  if (pathname.startsWith("/cocina")) return "Cargando cocina...";
  if (pathname.startsWith("/facturacion")) return "Cargando facturación...";
  if (pathname.startsWith("/planilla")) return "Cargando planilla...";
  if (pathname.startsWith("/inventario/compras")) return "Cargando compras...";
  if (pathname.startsWith("/inventario")) return "Cargando inventario...";
  if (pathname.startsWith("/contabilidad")) return "Cargando contabilidad...";
  if (pathname.startsWith("/analitica")) return "Cargando analítica...";
  if (pathname.startsWith("/admin/usuarios")) return "Cargando usuarios...";
  if (pathname.startsWith("/admin/mesas")) return "Cargando mesas...";
  if (pathname.startsWith("/admin/menu")) return "Cargando menú...";
  if (pathname.startsWith("/admin")) return "Cargando administración...";
  return "Cargando...";
}

function rutaActualKey(pathname: string) {
  if (typeof window === "undefined") return pathname;
  return `${pathname}${window.location.search}`;
}

/** Clic / router.push: mantiene el overlay hasta que cambie la ruta. */
export function startNavLoading(message?: string, destinoPathname?: string) {
  if (typeof window === "undefined") return;
  state.clickActivo = true;
  state.rutaOrigen = rutaActualKey(window.location.pathname);
  show(message ?? mensajeParaRuta(destinoPathname ?? window.location.pathname));
}

export function beginRouteLoad(message?: string) {
  state.routeDepth += 1;
  show(
    message ??
      (typeof window !== "undefined" ? mensajeParaRuta(window.location.pathname) : "Cargando...")
  );
}

export function endRouteLoad() {
  state.routeDepth = Math.max(0, state.routeDepth - 1);
  if (state.routeDepth === 0 && !state.clickActivo) {
    scheduleHide();
  }
}

/** Llamar cuando usePathname cambia. */
export function onPathnameChanged(pathname: string) {
  // Si hubo clic de navegacion, cerrar cuando la ruta ya cambio
  if (state.clickActivo) {
    const actual = rutaActualKey(pathname);
    if (state.rutaOrigen !== actual) {
      state.clickActivo = false;
      if (state.routeDepth === 0) scheduleHide();
    }
    return;
  }

  // Respaldo: si la ruta cambio sin pasar por nuestro start (prefetch raro),
  // igual mostrar un flash breve al llegar.
  if (state.visible) return;
}

export function esNavegacionInterna(anchor: HTMLAnchorElement, pathname: string) {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || anchor.target === "_blank") return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;

  try {
    const destino = new URL(href, window.location.origin);
    if (destino.origin !== window.location.origin) return false;
    const actual = `${pathname}${window.location.search}`;
    const next = `${destino.pathname}${destino.search}`;
    return actual !== next;
  } catch {
    return false;
  }
}
