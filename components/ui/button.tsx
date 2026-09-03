import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#FF4D3A] text-white shadow-[0_4px_14px_rgba(255,77,58,0.35)] hover:bg-[#FF3B26] hover:shadow-[0_6px_18px_rgba(255,59,38,0.45)]",
  secondary: "border border-sakura-200 bg-sakura-100/80 text-sumi-900 hover:bg-sakura-200/80",
  danger: "bg-umeboshi-500 text-white hover:opacity-90",
  ghost: "bg-transparent text-sumi-900 hover:bg-sakura-100/60",
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
