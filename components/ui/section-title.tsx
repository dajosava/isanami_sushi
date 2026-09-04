import { clsx } from "clsx";
import type { ReactNode } from "react";

export function SectionTitle({
  kanji,
  title,
  className,
  actions,
}: {
  kanji?: string;
  title: string;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={clsx("mb-3 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="isanami-section-title min-w-0 flex-1">
        {kanji ? <span className="isanami-section-kanji">{kanji}</span> : null}
        <h2 className="isanami-section-heading">{title}</h2>
      </div>
      {actions}
    </div>
  );
}
