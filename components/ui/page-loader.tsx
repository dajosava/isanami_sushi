import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function PageLoader({ label = "Cargando..." }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner size="lg" />
      <p className="text-sm text-washi-50/85">{label}</p>
    </div>
  );
}

export function LoadingOverlay({ label = "Cargando..." }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="isanami-panel flex flex-col items-center gap-3 px-8 py-6">
        <LoadingSpinner size="lg" className="text-[#FF4D3A]" />
        <p className="text-sm text-washi-50">{label}</p>
      </div>
    </div>
  );
}
