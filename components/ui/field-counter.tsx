import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Etiqueta opcional + contador visible tipo "45/80". */
export function FieldCounter({
  label,
  value,
  max,
  className,
  children,
}: {
  label?: string;
  value: string;
  max: number;
  className?: string;
  children: ReactNode;
}) {
  const len = value.length;
  const alLimite = len >= max;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <span className="text-sm font-medium text-sumi-800">{label}</span>
        ) : (
          <span />
        )}
        <span
          className={cn(
            "text-xs tabular-nums",
            alLimite ? "font-medium text-vermillion" : "text-sumi-600"
          )}
          aria-live="polite"
        >
          {len}/{max}
        </span>
      </div>
      {children}
    </div>
  );
}
