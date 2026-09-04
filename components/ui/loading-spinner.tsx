"use client";

import { IsanamiLogoLoader } from "@/components/ui/app-transition";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "sm",
  md: "md",
  lg: "lg",
} as const;

/** Reemplazo del circulo: logo Isanami con pulso. */
export function LoadingSpinner({
  size = "md",
  className,
}: {
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  return (
    <IsanamiLogoLoader
      size={sizeMap[size]}
      className={cn(size === "sm" && "scale-75", className)}
    />
  );
}
