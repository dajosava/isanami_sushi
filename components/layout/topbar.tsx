"use client";

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
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gold/20 bg-sumi-2/90 px-4 text-washi backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="isanami-touch-target inline-flex shrink-0 items-center justify-center rounded-md text-washi transition hover:bg-white/10 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
        ) : null}
        <p className="truncate text-sm text-washi/90">
          <span className="mr-2 font-display text-[10px] tracking-[0.2em] text-gold-dim">歓迎</span>
          Hola, {nombreUsuario}
        </p>
      </div>
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="shrink-0 border border-transparent text-washi hover:border-gold/30 hover:bg-white/10"
      >
        <span className="hidden sm:inline">Cerrar sesion</span>
        <span className="sm:hidden">Salir</span>
      </Button>
    </header>
  );
}
