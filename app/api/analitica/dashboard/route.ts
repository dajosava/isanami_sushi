import { NextRequest, NextResponse } from "next/server";
import { cargarDashboardAnalitica } from "@/app/(dashboard)/analitica/lib/queries";
import { filtrosAnaliticaSchema } from "@/app/(dashboard)/analitica/lib/types";
import { rangoDesdePreset } from "@/app/(dashboard)/analitica/lib/fechas";
import { getUsuarioActual, puedeVerAnalitica } from "@/lib/auth/usuario";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const preset = searchParams.get("preset") ?? "30d";
  const desdeParam = searchParams.get("desde");
  const hastaParam = searchParams.get("hasta");
  const canal = searchParams.get("canal");

  const rango =
    preset === "personalizado" && desdeParam && hastaParam
      ? { desde: desdeParam, hasta: hastaParam }
      : rangoDesdePreset(preset as never, desdeParam ?? undefined, hastaParam ?? undefined);

  const parsed = filtrosAnaliticaSchema.safeParse({
    preset,
    desde: rango.desde,
    hasta: rango.hasta,
    canal: canal || null,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros invalidos" }, { status: 400 });
  }

  const usuario = await getUsuarioActual();
  if (!usuario || !puedeVerAnalitica(usuario.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const dashboard = await cargarDashboardAnalitica(parsed.data);
    return NextResponse.json(dashboard);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al cargar analitica" },
      { status: 500 }
    );
  }
}
