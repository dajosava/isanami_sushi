import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "border border-gold/40 bg-gradient-to-b from-vermillion to-vermillion-deep text-washi shadow-lacquer transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(156,46,33,0.45)]",
  secondary:
    "border border-gold/35 bg-washi/90 text-ink hover:bg-washi hover:border-gold/55",
  danger:
    "border border-vermillion/50 bg-vermillion-deep text-washi hover:opacity-90",
  ghost: "bg-transparent text-washi hover:bg-white/10",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
