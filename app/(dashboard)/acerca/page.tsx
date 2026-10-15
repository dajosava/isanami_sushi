import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import { APP_INFO, formatearFechaDespliegue } from "@/lib/app-info";

export default function AcercaPage() {
  const filas: { etiqueta: string; valor: string }[] = [
    { etiqueta: "Versión", valor: `v${APP_INFO.version}` },
    { etiqueta: "Último despliegue", valor: formatearFechaDespliegue(APP_INFO.fechaDespliegue) },
    ...(APP_INFO.commit ? [{ etiqueta: "Compilación", valor: APP_INFO.commit }] : []),
    { etiqueta: "Desarrollador", valor: APP_INFO.desarrollador },
  ];

  return (
    <div>
      <SectionTitle kanji="情報" title="Acerca del sistema" className="mb-6" />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{APP_INFO.nombre}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-sumi-700">{APP_INFO.descripcion}</p>
          <dl className="divide-y divide-gold/20 rounded-md border border-gold/25">
            {filas.map((fila) => (
              <div key={fila.etiqueta} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-sumi-700">{fila.etiqueta}</dt>
                <dd className="text-right font-medium text-ink">{fila.valor}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-sumi-700">
            © {new Date().getFullYear()} {APP_INFO.desarrollador}. Todos los derechos reservados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
