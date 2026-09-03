import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ToastProvider } from "@/components/ui/toast";
import { QueryProvider } from "@/components/providers/query-provider";
import { NavigationProgress } from "@/components/providers/navigation-progress";
import { requireUsuarioActual } from "@/lib/auth/usuario";
import type { Rol } from "@/lib/auth/roles";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requireUsuarioActual();

  return (
    <ToastProvider>
      <QueryProvider>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <DashboardShell rol={usuario.rol as Rol} nombreUsuario={usuario.nombre}>
          {children}
        </DashboardShell>
      </QueryProvider>
    </ToastProvider>
  );
}
