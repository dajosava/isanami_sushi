"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PageLoader } from "@/components/ui/page-loader";
import type { Rol } from "@/lib/auth/roles";

const STORAGE_KEY = "isanami-sidebar-collapsed";

export function DashboardShell({
  rol,
  nombreUsuario,
  children,
}: {
  rol: Rol;
  nombreUsuario: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen bg-isanami-sakura">
        <PageLoader label="Iniciando..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Cerrar menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          rol={rol}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          onNavigate={() => setMobileNavOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          nombreUsuario={nombreUsuario}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="isanami-dashboard flex-1 bg-isanami-sakura p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
