"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

export function IsanamiSection({
  title,
  subtitle,
  children,
  className,
  bodyClassName,
  defaultOpen = true,
  collapsible = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
}) {
  const [abierta, setAbierta] = useState(defaultOpen);

  const header = (
    <div className="min-w-0">
      <h2 className="font-display text-lg font-semibold text-washi">{title}</h2>
      {subtitle ? <p className="text-xs text-washi/80">{subtitle}</p> : null}
    </div>
  );

  return (
    <div className={clsx("isanami-panel overflow-hidden", className)}>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          className="isanami-panel-header flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={abierta}
        >
          {header}
          <ChevronDown
            size={18}
            className={clsx("shrink-0 text-gold/80 transition-transform", abierta && "rotate-180")}
          />
        </button>
      ) : (
        <div className="isanami-panel-header px-4 py-3">{header}</div>
      )}
      {(!collapsible || abierta) && (
        <div className={clsx("isanami-panel-body", bodyClassName)}>{children}</div>
      )}
    </div>
  );
}
