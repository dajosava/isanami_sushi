"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  ClipboardList,
  ChefHat,
  Receipt,
  Package,
  ShoppingCart,
  Landmark,
  BarChart3,
  Users,
  LayoutGrid,
  BookOpen,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { Rol } from "@/lib/auth/roles";
import { SakuraBranch } from "@/components/ui/japanese-ornaments";
import { useNavigationLoading } from "@/components/providers/navigation-progress";
import { mensajeParaRuta } from "@/lib/navigation-loading-store";

interface NavItem {
  href: string;
  label: string;
  kanji: string;
  icon: React.ElementType;
  roles: Rol[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/pedidos", label: "Pedidos", kanji: "注文", icon: ClipboardList, roles: ["admin", "gerente", "cajero", "mesero"] },
  { href: "/cocina", label: "Cocina", kanji: "厨房", icon: ChefHat, roles: ["admin", "gerente", "cocina"] },
  { href: "/facturacion", label: "Facturacion", kanji: "会計", icon: Receipt, roles: ["admin", "gerente", "cajero"] },
  { href: "/inventario/insumos", label: "Inventario", kanji: "在庫", icon: Package, roles: ["admin", "gerente"] },
  { href: "/inventario/compras", label: "Compras", kanji: "仕入", icon: ShoppingCart, roles: ["admin", "gerente"] },
  { href: "/contabilidad/cierres", label: "Contabilidad", kanji: "経理", icon: Landmark, roles: ["admin", "gerente", "contador", "cajero"] },
  { href: "/analitica", label: "Analitica", kanji: "分析", icon: BarChart3, roles: ["admin", "gerente", "contador"] },
  { href: "/admin/usuarios", label: "Usuarios", kanji: "利用者", icon: Users, roles: ["admin"] },
  { href: "/admin/mesas", label: "Mesas", kanji: "卓", icon: LayoutGrid, roles: ["admin", "gerente"] },
  { href: "/admin/menu", label: "Menu", kanji: "献立", icon: BookOpen, roles: ["admin"] },
  { href: "/admin/configuracion", label: "Config", kanji: "設定", icon: Settings, roles: ["admin"] },
];

export function Sidebar({
  rol,
  collapsed,
  onToggle,
  onNavigate,
}: {
  rol: Rol;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { start } = useNavigationLoading();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(rol));
  const compact = collapsed;

  function handleNav(e: React.MouseEvent, href: string) {
    onNavigate?.();
    if (pathname === href) return;
    e.preventDefault();
    start(mensajeParaRuta(href), href);
    router.push(href);
  }

  return (
    <aside
      className={clsx(
        "bg-isanami-washi relative z-10 flex h-full max-h-screen w-60 shrink-0 flex-col border-r border-gold/25 text-ink shadow-washi lg:sticky lg:top-0 lg:h-screen",
        compact ? "lg:w-[4.5rem]" : "lg:w-60"
      )}
    >
      <div className={clsx("relative px-3 pt-4", compact ? "lg:pb-2" : "pb-3")}>
        {!compact ? (
          <span
            className="pointer-events-none absolute right-2 top-6 hidden font-display text-[11px] leading-relaxed tracking-[0.35em] text-gold-dim/45 [writing-mode:vertical-rl] lg:block"
            aria-hidden
          >
            波寿司
          </span>
        ) : null}

        <Link
          href="/pedidos"
          onClick={(e) => handleNav(e, "/pedidos")}
          className="relative mx-auto block w-[88%] overflow-hidden rounded-full border-[3px] border-washi shadow-[0_0_0_2px_rgba(200,64,47,0.35)] transition hover:opacity-95"
          aria-label="Isanami Sushi"
        >
          <span className="pointer-events-none absolute inset-1 rounded-full border border-washi/80" aria-hidden />
          <Image
            src="/isanami-logo.png"
            alt="Isanami Sushi"
            width={448}
            height={448}
            className="h-auto w-full"
            priority
          />
        </Link>

        {!compact ? (
          <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-gold-dim">
            Hojancha · Guanacaste
          </p>
        ) : (
          <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-gold-dim lg:hidden">
            Hojancha
          </p>
        )}
      </div>

      <div className={clsx("hidden px-2 pb-2 lg:block", compact && "flex justify-center")}>
        <button
          type="button"
          onClick={onToggle}
          className={clsx(
            "isanami-touch-target inline-flex items-center justify-center rounded-md text-ink/80 transition hover:bg-ink/5 hover:text-ink",
            compact ? "h-9 w-9" : "h-9 w-full gap-2 px-3 text-sm"
          )}
          aria-label={compact ? "Expandir menu" : "Colapsar menu"}
          title={compact ? "Expandir" : "Colapsar"}
        >
          {compact ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!compact && <span>Colapsar</span>}
        </button>
      </div>

      <nav className="isanami-safe-bottom flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNav(e, item.href)}
              title={`${item.label} (${item.kanji})`}
              className={clsx(
                "isanami-touch-target relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
                compact && "lg:justify-center lg:px-0",
                active
                  ? "bg-gradient-to-r from-vermillion to-vermillion-deep pl-4 text-washi shadow-lacquer"
                  : "text-ink hover:bg-ink/[0.06]"
              )}
            >
              {active ? (
                <span
                  className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_6px_rgba(201,163,92,0.8)]"
                  aria-hidden
                />
              ) : null}
              <Icon size={20} className="shrink-0" />
              <span className={clsx("min-w-0 truncate", compact && "lg:hidden")}>
                <span className="block leading-tight">{item.label}</span>
                {!compact ? (
                  <span
                    className={clsx(
                      "block text-[10px] tracking-[0.18em]",
                      active ? "text-washi/70" : "text-gold-dim/70"
                    )}
                  >
                    {item.kanji}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </nav>

      {!compact ? (
        <div className="mt-auto border-t border-gold/20 px-3 py-3">
          <SakuraBranch className="mx-auto h-10 w-full max-w-[180px] opacity-90" />
        </div>
      ) : (
        <div className="mt-auto hidden border-t border-gold/20 px-2 py-3 lg:block">
          <div className="mx-auto h-2 w-2 rounded-full bg-sakura-deep/70" aria-hidden />
        </div>
      )}
    </aside>
  );
}
