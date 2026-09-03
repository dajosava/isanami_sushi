"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  UtensilsCrossed,
  ChefHat,
  Receipt,
  Boxes,
  Calculator,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
} from "lucide-react";
import type { Rol } from "@/lib/auth/roles";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Rol[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/pedidos", label: "Pedidos", icon: UtensilsCrossed, roles: ["admin", "gerente", "cajero", "mesero"] },
  { href: "/cocina", label: "Cocina", icon: ChefHat, roles: ["admin", "gerente", "cocina"] },
  { href: "/facturacion", label: "Facturacion", icon: Receipt, roles: ["admin", "gerente", "cajero"] },
  { href: "/inventario/insumos", label: "Inventario", icon: Boxes, roles: ["admin", "gerente"] },
  { href: "/inventario/compras", label: "Compras", icon: Boxes, roles: ["admin", "gerente"] },
  { href: "/contabilidad/cierres", label: "Contabilidad", icon: Calculator, roles: ["admin", "gerente", "contador", "cajero"] },
  { href: "/analitica", label: "Analitica", icon: BarChart3, roles: ["admin", "gerente", "contador"] },
  { href: "/admin/usuarios", label: "Usuarios", icon: Settings, roles: ["admin"] },
  { href: "/admin/mesas", label: "Mesas", icon: Settings, roles: ["admin", "gerente"] },
  { href: "/admin/menu", label: "Menu", icon: Settings, roles: ["admin"] },
  { href: "/admin/configuracion", label: "Config", icon: Settings, roles: ["admin"] },
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
  const items = NAV_ITEMS.filter((item) => item.roles.includes(rol));
  const compact = collapsed;

  return (
    <aside
      className={clsx(
        "bg-isanami-sakura flex h-full max-h-screen w-60 shrink-0 flex-col border-r border-sakura-600/30 text-washi-50 shadow-xl lg:sticky lg:top-0 lg:h-screen lg:shadow-none",
        compact ? "lg:w-[4.5rem]" : "lg:w-60"
      )}
    >
      <div className={clsx("px-3 pt-4", compact ? "lg:pb-2" : "pb-3")}>
        <Link
          href="/pedidos"
          onClick={onNavigate}
          className="block overflow-hidden rounded-lg bg-washi-50 shadow-sm transition hover:opacity-95"
          aria-label="Isanami Sushi"
        >
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
          <p className="mt-2 text-center text-[11px] tracking-wide text-washi-50/90">
            Hojancha &middot; Guanacaste
          </p>
        ) : (
          <p className="mt-2 text-center text-[11px] tracking-wide text-washi-50/90 lg:hidden">
            Hojancha &middot; Guanacaste
          </p>
        )}
      </div>

      <div className={clsx("hidden px-2 pb-2 lg:block", compact && "flex justify-center")}>
        <button
          type="button"
          onClick={onToggle}
          className={clsx(
            "isanami-touch-target inline-flex items-center justify-center rounded-md text-washi-50 transition hover:bg-black/25 hover:text-white",
            compact ? "h-9 w-9" : "h-9 w-full gap-2 px-3 text-sm"
          )}
          aria-label={compact ? "Expandir menu" : "Colapsar menu"}
          title={compact ? "Expandir" : "Colapsar"}
        >
          {compact ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!compact && <span>Colapsar</span>}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4 isanami-safe-bottom">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={item.label}
              className={clsx(
                "isanami-touch-target flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
                compact && "lg:justify-center lg:px-0",
                active ? "bg-[#FF4D3A] text-white" : "text-washi-50 hover:bg-black/25 hover:text-white"
              )}
            >
              <Icon size={20} className="shrink-0" />
              <span className={clsx("truncate", compact && "lg:hidden")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
