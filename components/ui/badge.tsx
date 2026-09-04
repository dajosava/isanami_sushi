import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

type Tono = "neutro" | "exito" | "advertencia" | "peligro" | "info";

const tonoClasses: Record<Tono, string> = {
  neutro: "border border-gold/30 bg-washi-dim/80 text-ink",
  exito: "border border-wasabi-500/40 bg-wasabi-400/20 text-wasabi-500",
  advertencia: "border border-gold/45 bg-gold/15 text-gold-dim",
  peligro: "border border-vermillion/40 bg-vermillion/15 text-vermillion",
  info: "border border-sakura-deep/40 bg-sakura/25 text-ink",
};

export function Badge({
  tono = "neutro",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tono?: Tono }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        tonoClasses[tono],
        className
      )}
      {...props}
    />
  );
}
