import { getRestauranteConfig } from "@/lib/restaurante/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigForm } from "@/components/admin/config-form";

export default async function ConfiguracionPage() {
  const config = await getRestauranteConfig();

  if (!config) {
    return <p className="text-sm text-sumi-700">No hay configuracion registrada.</p>;
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Configuracion del restaurante</CardTitle>
      </CardHeader>
      <CardContent>
      <ConfigForm
        config={{
          nombre_comercial: config.nombre_comercial,
          cedula_juridica: config.cedula_juridica,
          telefono: config.telefono,
          email_facturacion: config.email_facturacion,
          provincia: config.provincia,
          canton: config.canton,
          distrito: config.distrito,
          senas_exactas: config.senas_exactas,
        }}
      />
      </CardContent>
    </Card>
  );
}
