"use client";

import { useEffect, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { LoadingOverlay } from "@/components/ui/page-loader";

export function GlobalQueryLoader() {
  const fetching = useIsFetching({
    predicate: (query) => !query.meta?.hideGlobalLoader,
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (fetching > 0) {
      const timer = window.setTimeout(() => setVisible(true), 200);
      return () => window.clearTimeout(timer);
    }
    setVisible(false);
  }, [fetching]);

  if (!visible) return null;
  return <LoadingOverlay label="Cargando datos..." />;
}
