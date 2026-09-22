import { minutosAHorasDecimal, minutosTrabajados } from "@/lib/planilla/horas";

export type ColaboradorResumenInput = {
  id: string;
  nombre: string;
  rol: string;
  tarifaHora: number | null;
};

export type RegistroResumenInput = {
  usuarioId: string;
  nombre: string;
  horaEntrada: string | null;
  horaSalida: string | null;
};

export type FilaResumenPago = {
  usuarioId: string;
  nombre: string;
  rol: string;
  minutos: number;
  diasCompletos: number;
  diasPendientes: number;
  horas: number;
  tarifa: number | null;
  pago: number | null;
};

export function calcularResumenPago(
  colaboradores: ColaboradorResumenInput[],
  registros: RegistroResumenInput[],
  options?: { incluirTodosColaboradores?: boolean }
): FilaResumenPago[] {
  const incluirTodos = options?.incluirTodosColaboradores ?? false;

  const porUsuario = new Map<
    string,
    {
      usuarioId: string;
      nombre: string;
      rol: string;
      minutos: number;
      diasCompletos: number;
      diasPendientes: number;
    }
  >();

  if (incluirTodos) {
    for (const c of colaboradores) {
      porUsuario.set(c.id, {
        usuarioId: c.id,
        nombre: c.nombre,
        rol: c.rol,
        minutos: 0,
        diasCompletos: 0,
        diasPendientes: 0,
      });
    }
  }

  for (const reg of registros) {
    const mins = minutosTrabajados(reg.horaEntrada, reg.horaSalida);
    const colab = colaboradores.find((c) => c.id === reg.usuarioId);
    const actual = porUsuario.get(reg.usuarioId) ?? {
      usuarioId: reg.usuarioId,
      nombre: reg.nombre,
      rol: colab?.rol ?? "",
      minutos: 0,
      diasCompletos: 0,
      diasPendientes: 0,
    };
    if (mins != null) {
      actual.minutos += mins;
      actual.diasCompletos += 1;
    } else {
      actual.diasPendientes += 1;
    }
    porUsuario.set(reg.usuarioId, actual);
  }

  return Array.from(porUsuario.values())
    .map((row) => {
      const colab = colaboradores.find((c) => c.id === row.usuarioId);
      const tarifaRaw = colab?.tarifaHora;
      const tarifa =
        tarifaRaw != null && Number.isFinite(tarifaRaw) && tarifaRaw >= 0 ? tarifaRaw : null;
      const horas = minutosAHorasDecimal(row.minutos);
      return {
        ...row,
        rol: colab?.rol ?? row.rol,
        horas,
        tarifa,
        pago: tarifa != null ? Math.round(horas * tarifa) : null,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
