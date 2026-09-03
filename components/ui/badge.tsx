import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

type Tono = "neutro" | "exito" | "advertencia" | "peligro" | "info";

const tonoClasses: Record<Tono, string> = {
  neutro: "bg-washi-200 text-sumi-800",
  exito: "bg-wasabi-400/20 text-wasabi-500",
  advertencia: "bg-yellow-100 text-yellow-800",
  peligro: "bg-umeboshi-500/10 text-umeboshi-500",
  info: "bg-sakura-500/20 text-sakura-600",
};

export function Badge({
  tono = "neutro",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tono?: Tono }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tonoClasses[tono],
        className
      )}
      {...props}
    />
  );
}
