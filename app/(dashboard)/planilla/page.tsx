import { createClient } from "@/lib/supabase/server";
import { requireUsuarioActual } from "@/lib/auth/usuario";
import { SectionTitle } from "@/components/ui/section-title";
import { PlanillaClient } from "@/components/planilla/planilla-client";

function hoyCR(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function haceDiasCR(dias: number): string {
  const base = new Date(`${hoyCR()}T12:00:00-06:00`);
  base.setDate(base.getDate() - dias);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(base);
}

async function cargarColaboradores(
  supabase: ReturnType<typeof createClient>,
  usuarioId: string,
  puedeGestionarTodos: boolean
) {
  // 1) Listado base (sin tarifa) — no depende de migración 0023
  let query = supabase.from("usuarios").select("id, nombre, rol, activo").order("nombre");

  if (puedeGestionarTodos) {
    // Admin/gerente: todos los activos; si no hay activos, mostrar todos
    const { data: activos, error: errActivos } = await query.eq("activo", true);
    if (errActivos) {
      console.error("[planilla] error colaboradores:", errActivos.message);
    }

    if (activos && activos.length > 0) {
      return activos;
    }

    const { data: todos, error: errTodos } = await supabase
      .from("usuarios")
      .select("id, nombre, rol, activo")
      .order("nombre");

    if (errTodos) {
      console.error("[planilla] error colaboradores (todos):", errTodos.message);
    }
    return todos ?? [];
  }

  const { data: propio, error } = await supabase
    .from("usuarios")
    .select("id, nombre, rol, activo")
    .eq("id", usuarioId)
    .maybeSingle();

  if (error) {
    console.error("[planilla] error colaborador propio:", error.message);
  }
  return propio ? [propio] : [];
}

async function cargarTarifas(
  supabase: ReturnType<typeof createClient>,
  ids: string[]
): Promise<Map<string, number | null>> {
  const map = new Map<string, number | null>();
  if (ids.length === 0) return map;

  const { data, error } = await supabase.from("usuarios").select("id, tarifa_hora").in("id", ids);

  if (error) {
    // Columna tarifa_hora aún no aplicada — ignorar
    console.warn("[planilla] tarifas no disponibles:", error.message);
    return map;
  }

  for (const row of data ?? []) {
    map.set(row.id, row.tarifa_hora != null ? Number(row.tarifa_hora) : null);
  }
  return map;
}

export default async function PlanillaPage({
  searchParams,
}: {
  searchParams?: { desde?: string; hasta?: string };
}) {
  const usuario = await requireUsuarioActual();
  const supabase = createClient();

  const fechaHasta =
    searchParams?.hasta && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.hasta)
      ? searchParams.hasta
      : hoyCR();
  const fechaDesde =
    searchParams?.desde && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.desde)
      ? searchParams.desde
      : haceDiasCR(14);

  const puedeGestionarTodos = ["admin", "gerente"].includes(usuario.rol);
  const fechaHoy = hoyCR();

  const [colaboradoresBase, { data: registros, error: errorRegistros }, { data: miHoyRow }] =
    await Promise.all([
      cargarColaboradores(supabase, usuario.id, puedeGestionarTodos),
      supabase
        .from("planilla_registros")
        .select("id, usuario_id, fecha, hora_entrada, hora_salida, notas")
        .gte("fecha", fechaDesde)
        .lte("fecha", fechaHasta)
        .order("fecha", { ascending: false })
        .order("hora_entrada", { ascending: true }),
      supabase
        .from("planilla_registros")
        .select("id, usuario_id, fecha, hora_entrada, hora_salida, notas")
        .eq("usuario_id", usuario.id)
        .eq("fecha", fechaHoy)
        .maybeSingle(),
    ]);

  if (errorRegistros) {
    console.error("[planilla] error listando registros:", errorRegistros.message);
  }

  const tarifas = await cargarTarifas(
    supabase,
    colaboradoresBase.map((c) => c.id)
  );

  const colaboradores = colaboradoresBase.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    rol: c.rol,
    tarifaHora: tarifas.get(c.id) ?? null,
  }));

  const idsTrabajadores = Array.from(
    new Set((registros ?? []).map((r) => r.usuario_id).filter(Boolean))
  );

  const nombresPorId = new Map<string, string>(colaboradores.map((c) => [c.id, c.nombre]));

  const faltantes = idsTrabajadores.filter((id) => !nombresPorId.has(id));
  if (faltantes.length > 0) {
    const { data: extras } = await supabase
      .from("usuarios")
      .select("id, nombre")
      .in("id", faltantes);
    for (const u of extras ?? []) {
      nombresPorId.set(u.id, u.nombre);
    }
  }

  return (
    <div>
      <SectionTitle kanji="出勤" title="Planilla" className="mb-6" />
      <p className="mb-6 max-w-2xl text-sm text-washi/75">
        Asistencia ligada a las cuentas del sistema. Cada colaborador marca su entrada y salida;
        administración puede registrar o editar a cualquier persona.
      </p>
      <PlanillaClient
        usuarioActualId={usuario.id}
        puedeGestionarTodos={puedeGestionarTodos}
        colaboradores={colaboradores}
        registros={(registros ?? []).map((r) => ({
          id: r.id,
          usuarioId: r.usuario_id,
          nombre: nombresPorId.get(r.usuario_id) ?? "Colaborador",
          fecha: r.fecha,
          horaEntrada: r.hora_entrada,
          horaSalida: r.hora_salida,
          notas: r.notas,
        }))}
        miRegistroHoy={
          miHoyRow
            ? {
                id: miHoyRow.id,
                usuarioId: miHoyRow.usuario_id,
                nombre: usuario.nombre,
                fecha: miHoyRow.fecha,
                horaEntrada: miHoyRow.hora_entrada,
                horaSalida: miHoyRow.hora_salida,
                notas: miHoyRow.notas,
              }
            : null
        }
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        fechaHoy={fechaHoy}
      />
    </div>
  );
}
