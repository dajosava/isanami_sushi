"use client";

import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function Topbar({
  nombreUsuario,
  onMenuClick,
}: {
  nombreUsuario: string;
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sakura-600/30 bg-isanami-sakura px-4 text-washi-50 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="isanami-touch-target inline-flex shrink-0 items-center justify-center rounded-md text-washi-50 transition hover:bg-black/25 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
        ) : null}
        <p className="truncate text-sm text-washi-50">Hola, {nombreUsuario}</p>
      </div>
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="shrink-0 text-washi-50 hover:bg-black/25"
      >
        <span className="hidden sm:inline">Cerrar sesion</span>
        <span className="sm:hidden">Salir</span>
      </Button>
    </header>
  );
}
