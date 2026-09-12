"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { LoadingOverlay } from "@/components/ui/page-loader";
import { EditIconButton } from "@/components/ui/edit-icon-button";
import { formatColon } from "@/lib/utils";
import {
  formatearDuracion,
  formatearHorasDecimal,
  minutosAHorasDecimal,
  minutosTrabajados,
} from "@/lib/planilla/horas";
import {
  actualizarTarifaHora,
  eliminarPlanillaRegistro,
  marcarMiPlanilla,
  upsertPlanillaRegistro,
} from "@/actions/planilla.actions";

export interface ColaboradorPlanilla {
  id: string;
  nombre: string;
  rol: string;
  tarifaHora: number | null;
}

export interface RegistroPlanilla {
  id: string;
  usuarioId: string;
  nombre: string;
  fecha: string;
  horaEntrada: string | null;
  horaSalida: string | null;
  notas: string | null;
}

function normalizarHora(valor: string | null | undefined) {
  if (!valor) return "";
  return String(valor).slice(0, 5);
}

export function PlanillaClient({
  usuarioActualId,
  puedeGestionarTodos,
  colaboradores,
  registros,
  miRegistroHoy,
  fechaDesde,
  fechaHasta,
  fechaHoy,
}: {
  usuarioActualId: string;
  puedeGestionarTodos: boolean;
  colaboradores: ColaboradorPlanilla[];
  registros: RegistroPlanilla[];
  miRegistroHoy: RegistroPlanilla | null;
  fechaDesde: string;
  fechaHasta: string;
  fechaHoy: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const miHoy = miRegistroHoy;

  const [usuarioId, setUsuarioId] = useState(
    puedeGestionarTodos ? (colaboradores[0]?.id ?? usuarioActualId) : usuarioActualId
  );
  const [fecha, setFecha] = useState(fechaHoy);
  const [horaEntrada, setHoraEntrada] = useState("");
  const [horaSalida, setHoraSalida] = useState("");
  const [notas, setNotas] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const [filtroDesde, setFiltroDesde] = useState(fechaDesde);
  const [filtroHasta, setFiltroHasta] = useState(fechaHasta);

  const [tarifasDraft, setTarifasDraft] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const c of colaboradores) {
      init[c.id] = c.tarifaHora != null ? String(c.tarifaHora) : "";
    }
    return init;
  });

  useEffect(() => {
    setTarifasDraft((prev) => {
      const next: Record<string, string> = { ...prev };
      for (const c of colaboradores) {
        next[c.id] = c.tarifaHora != null ? String(c.tarifaHora) : prev[c.id] ?? "";
      }
      return next;
    });
  }, [colaboradores]);

  useEffect(() => {
    if (colaboradores.length === 0) return;
    if (!colaboradores.some((c) => c.id === usuarioId)) {
      setUsuarioId(colaboradores[0].id);
    }
  }, [colaboradores, usuarioId]);

  const resumenPago = useMemo(() => {
    const porUsuario = new Map<
      string,
      { usuarioId: string; nombre: string; minutos: number; diasCompletos: number; diasPendientes: number }
    >();

    for (const reg of registros) {
      const mins = minutosTrabajados(reg.horaEntrada, reg.horaSalida);
      const actual = porUsuario.get(reg.usuarioId) ?? {
        usuarioId: reg.usuarioId,
        nombre: reg.nombre,
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
        const tarifa =
          colab?.tarifaHora ??
          (tarifasDraft[row.usuarioId] ? Number(tarifasDraft[row.usuarioId]) : null);
        const tarifaNum =
          tarifa != null && Number.isFinite(tarifa) && tarifa >= 0 ? tarifa : null;
        const horas = minutosAHorasDecimal(row.minutos);
        return {
          ...row,
          horas,
          tarifa: tarifaNum,
          pago: tarifaNum != null ? Math.round(horas * tarifaNum) : null,
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [registros, colaboradores, tarifasDraft]);

  const totalesPeriodo = useMemo(() => {
    const minutos = resumenPago.reduce((acc, r) => acc + r.minutos, 0);
    const pago = resumenPago.reduce((acc, r) => acc + (r.pago ?? 0), 0);
    const conTarifa = resumenPago.some((r) => r.pago != null);
    return { minutos, pago, conTarifa };
  }, [resumenPago]);

  function aplicarFiltro() {
    const params = new URLSearchParams();
    params.set("desde", filtroDesde);
    params.set("hasta", filtroHasta);
    router.push(`/planilla?${params.toString()}`);
  }

  function limpiarFormulario() {
    setEditId(null);
    setFecha(fechaHoy);
    setHoraEntrada("");
    setHoraSalida("");
    setNotas("");
    if (!puedeGestionarTodos) setUsuarioId(usuarioActualId);
  }

  function cargarEdicion(reg: RegistroPlanilla) {
    setEditId(reg.id);
    setUsuarioId(reg.usuarioId);
    setFecha(reg.fecha);
    setHoraEntrada(normalizarHora(reg.horaEntrada));
    setHoraSalida(normalizarHora(reg.horaSalida));
    setNotas(reg.notas ?? "");
  }

  function guardar() {
    startTransition(async () => {
      const result = await upsertPlanillaRegistro({
        id: editId ?? undefined,
        usuarioId,
        fecha,
        horaEntrada: horaEntrada || null,
        horaSalida: horaSalida || null,
        notas: notas || null,
      });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast(editId ? "Registro actualizado" : "Registro guardado", "exito");
      limpiarFormulario();
      router.refresh();
    });
  }

  function marcar(tipo: "entrada" | "salida") {
    startTransition(async () => {
      const result = await marcarMiPlanilla({ tipo });
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast(
        tipo === "entrada"
          ? `Entrada marcada a las ${result.hora}`
          : `Salida marcada a las ${result.hora}`,
        "exito"
      );
      router.refresh();
    });
  }

  function eliminar(id: string) {
    if (!window.confirm("¿Eliminar este registro de planilla?")) return;
    startTransition(async () => {
      const result = await eliminarPlanillaRegistro(id);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Registro eliminado", "exito");
      if (editId === id) limpiarFormulario();
      router.refresh();
    });
  }

  function guardarTarifa(usuarioTarifaId: string) {
    const raw = tarifasDraft[usuarioTarifaId]?.trim() ?? "";
    const valor = raw === "" ? null : Number(raw);
    if (raw !== "" && (Number.isNaN(valor!) || valor! < 0)) {
      toast("Tarifa inválida", "peligro");
      return;
    }
    startTransition(async () => {
      const result = await actualizarTarifaHora(usuarioTarifaId, valor);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Tarifa guardada", "exito");
      router.refresh();
    });
  }

  return (
    <>
      {pending ? <LoadingOverlay label="Guardando planilla..." /> : null}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mi asistencia de hoy</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-sumi-700">
              Entrada:{" "}
              <span className="font-medium text-sumi-900">
                {normalizarHora(miHoy?.horaEntrada) || "—"}
              </span>
              {" · "}
              Salida:{" "}
              <span className="font-medium text-sumi-900">
                {normalizarHora(miHoy?.horaSalida) || "—"}
              </span>
              {" · "}
              Horas:{" "}
              <span className="font-medium text-sumi-900">
                {formatearDuracion(
                  minutosTrabajados(miHoy?.horaEntrada, miHoy?.horaSalida)
                )}
              </span>
            </p>
            <Button
              type="button"
              onClick={() => marcar("entrada")}
              disabled={pending || Boolean(miHoy?.horaEntrada)}
            >
              Marcar entrada
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => marcar("salida")}
              disabled={pending || !miHoy?.horaEntrada || Boolean(miHoy?.horaSalida)}
            >
              Marcar salida
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editId ? "Editar registro" : "Registrar asistencia"}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-sumi-800">Trabajador</label>
              <Select
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                disabled={!puedeGestionarTodos || colaboradores.length === 0}
              >
                {colaboradores.length === 0 ? (
                  <option value="">Sin colaboradores disponibles</option>
                ) : (
                  colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.rol})
                    </option>
                  ))
                )}
              </Select>
              {puedeGestionarTodos && colaboradores.length === 0 ? (
                <p className="mt-1 text-xs text-vermillion">
                  No se pudieron cargar usuarios. Revisa que existan en Admin → Usuarios y que
                  estén activos.
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-sumi-800">Fecha</label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-sumi-800">Hora entrada</label>
              <Input
                type="time"
                value={horaEntrada}
                onChange={(e) => setHoraEntrada(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-sumi-800">Hora salida</label>
              <Input
                type="time"
                value={horaSalida}
                onChange={(e) => setHoraSalida(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-sumi-800">Notas</label>
              <Input
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Opcional"
                maxLength={300}
              />
            </div>
            <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="button" onClick={guardar} disabled={pending || !usuarioId || !fecha}>
                {editId ? "Actualizar" : "Guardar"}
              </Button>
              {editId ? (
                <Button type="button" variant="ghost" onClick={limpiarFormulario}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cálculo para pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-sumi-700">
              Horas del periodo {fechaDesde} → {fechaHasta}. El pago estimado usa la tarifa por
              hora de cada colaborador (₡/h).
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gold/25 text-sumi-700">
                    <th className="px-3 py-2 font-medium">Trabajador</th>
                    <th className="px-3 py-2 font-medium">Horas</th>
                    <th className="px-3 py-2 font-medium">Días ok</th>
                    <th className="px-3 py-2 font-medium">Pendientes</th>
                    {puedeGestionarTodos ? (
                      <th className="px-3 py-2 font-medium">Tarifa ₡/h</th>
                    ) : null}
                    <th className="px-3 py-2 font-medium">Pago estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenPago.length === 0 ? (
                    <tr>
                      <td
                        colSpan={puedeGestionarTodos ? 6 : 5}
                        className="px-3 py-6 text-sumi-600"
                      >
                        No hay horas calculables en este periodo.
                      </td>
                    </tr>
                  ) : (
                    resumenPago.map((row) => (
                      <tr key={row.usuarioId} className="border-b border-gold/10 text-sumi-900">
                        <td className="px-3 py-2">{row.nombre}</td>
                        <td className="px-3 py-2 tabular-nums">
                          {formatearDuracion(row.minutos)}{" "}
                          <span className="text-sumi-600">
                            ({formatearHorasDecimal(row.minutos)} h)
                          </span>
                        </td>
                        <td className="px-3 py-2 tabular-nums">{row.diasCompletos}</td>
                        <td className="px-3 py-2 tabular-nums">{row.diasPendientes}</td>
                        {puedeGestionarTodos ? (
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                step="50"
                                className="w-28"
                                value={tarifasDraft[row.usuarioId] ?? ""}
                                onChange={(e) =>
                                  setTarifasDraft((prev) => ({
                                    ...prev,
                                    [row.usuarioId]: e.target.value,
                                  }))
                                }
                                placeholder="0"
                              />
                              <button
                                type="button"
                                className="text-sm text-vermillion underline-offset-2 hover:underline"
                                onClick={() => guardarTarifa(row.usuarioId)}
                              >
                                Guardar
                              </button>
                            </div>
                          </td>
                        ) : null}
                        <td className="px-3 py-2 font-medium tabular-nums">
                          {row.pago != null ? formatColon(row.pago) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {resumenPago.length > 0 ? (
                  <tfoot>
                    <tr className="border-t border-gold/30 text-sumi-900">
                      <td className="px-3 py-2 font-semibold">Total periodo</td>
                      <td className="px-3 py-2 font-semibold tabular-nums">
                        {formatearDuracion(totalesPeriodo.minutos)}{" "}
                        <span className="font-normal text-sumi-600">
                          ({formatearHorasDecimal(totalesPeriodo.minutos)} h)
                        </span>
                      </td>
                      <td colSpan={puedeGestionarTodos ? 3 : 2} />
                      <td className="px-3 py-2 font-semibold tabular-nums">
                        {totalesPeriodo.conTarifa ? formatColon(totalesPeriodo.pago) : "—"}
                      </td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-sumi-800">Desde</label>
                <Input
                  type="date"
                  value={filtroDesde}
                  onChange={(e) => setFiltroDesde(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-sumi-800">Hasta</label>
                <Input
                  type="date"
                  value={filtroHasta}
                  onChange={(e) => setFiltroHasta(e.target.value)}
                />
              </div>
              <Button type="button" variant="secondary" onClick={aplicarFiltro}>
                Filtrar
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gold/25 text-sumi-700">
                    <th className="px-3 py-2 font-medium">Trabajador</th>
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium">Entrada</th>
                    <th className="px-3 py-2 font-medium">Salida</th>
                    <th className="px-3 py-2 font-medium">Horas</th>
                    <th className="px-3 py-2 font-medium">Notas</th>
                    <th className="px-3 py-2 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-sumi-600">
                        No hay registros en este periodo.
                      </td>
                    </tr>
                  ) : (
                    registros.map((reg) => {
                      const mins = minutosTrabajados(reg.horaEntrada, reg.horaSalida);
                      return (
                        <tr key={reg.id} className="border-b border-gold/10 text-sumi-900">
                          <td className="px-3 py-2">{reg.nombre}</td>
                          <td className="px-3 py-2 tabular-nums">{reg.fecha}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {normalizarHora(reg.horaEntrada) || "—"}
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {normalizarHora(reg.horaSalida) || "—"}
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {formatearDuracion(mins)}
                            {mins != null ? (
                              <span className="text-sumi-600">
                                {" "}
                                ({formatearHorasDecimal(mins)})
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-sumi-700">{reg.notas || "—"}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {(puedeGestionarTodos || reg.usuarioId === usuarioActualId) && (
                                <EditIconButton
                                  onClick={() => cargarEdicion(reg)}
                                  label={`Editar registro de ${reg.nombre}`}
                                />
                              )}
                              {puedeGestionarTodos ? (
                                <button
                                  type="button"
                                  className="text-sm text-sumi-600 underline-offset-2 hover:underline"
                                  onClick={() => eliminar(reg.id)}
                                >
                                  Eliminar
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
