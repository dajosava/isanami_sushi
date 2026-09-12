"use client";

import { Pencil } from "lucide-react";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

/** Botón de editar unificado (lápiz) para toda la app. */
export function EditIconButton({
  label = "Editar",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sakura-600 transition hover:bg-sakura-100 disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    >
      <Pencil size={15} strokeWidth={2} aria-hidden />
    </button>
  );
}
