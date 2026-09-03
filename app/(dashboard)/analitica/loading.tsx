export default function AnaliticaLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Cargando analítica">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-md bg-white/10" />
        <div className="h-4 w-72 rounded-md bg-white/10" />
      </div>
      <div className="h-10 w-full rounded-md bg-white/10" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-white/10" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="h-72 rounded-lg bg-white/10" />
        <div className="h-72 rounded-lg bg-white/10" />
      </div>
    </div>
  );
}
