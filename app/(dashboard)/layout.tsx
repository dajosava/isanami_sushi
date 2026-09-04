import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ToastProvider } from "@/components/ui/toast";
import { QueryProvider } from "@/components/providers/query-provider";
import { NavigationLoadingProvider } from "@/components/providers/navigation-progress";
import { requireUsuarioActual } from "@/lib/auth/usuario";
import type { Rol } from "@/lib/auth/roles";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requireUsuarioActual();

  return (
    <ToastProvider>
      <QueryProvider>
        <NavigationLoadingProvider>
          <DashboardShell rol={usuario.rol as Rol} nombreUsuario={usuario.nombre}>
            {children}
          </DashboardShell>
        </NavigationLoadingProvider>
      </QueryProvider>
    </ToastProvider>
  );
}
