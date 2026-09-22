-- ============================================================================
-- 0030: Reportes contador — mensual (IVA) y anual (resultado)
-- ============================================================================

create or replace function assert_contador_reportes_access()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth_rol() not in ('admin', 'gerente', 'contador') then
    raise exception 'No autorizado para reportes de contabilidad';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reporte mensual: ventas, compras e IVA
-- ---------------------------------------------------------------------------
create or replace function reporte_contador_mensual(p_anio int, p_mes int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_desde date;
  v_hasta date;
  v_ventas record;
  v_compras record;
  v_iva_pagado numeric(12,2);
  v_diferencia numeric(12,2);
begin
  perform assert_contador_reportes_access();

  if p_mes < 1 or p_mes > 12 then
    raise exception 'Mes inválido (1-12)';
  end if;
  if p_anio < 2000 or p_anio > 2100 then
    raise exception 'Año inválido';
  end if;

  v_desde := make_date(p_anio, p_mes, 1);
  v_hasta := (v_desde + interval '1 month' - interval '1 day')::date;

  select
    coalesce(sum(f.total_comprobante), 0)::numeric(12,2) as total_vendido,
    coalesce(sum(f.total_impuesto), 0)::numeric(12,2) as iva_cobrado,
    count(*) filter (where f.estado = 'cobrada')::int as num_facturas
  into v_ventas
  from facturas f
  where f.estado = 'cobrada'
    and analytics_fecha_cr(f.fecha_emision) between v_desde and v_hasta;

  select
    coalesce(sum(c.total), 0)::numeric(12,2) as total_comprado,
    coalesce(sum(c.total_impuesto) filter (where c.impuesto_iva_pct = 13), 0)::numeric(12,2) as iva_compras_13,
    coalesce(sum(c.total_impuesto) filter (where c.impuesto_iva_pct = 1), 0)::numeric(12,2) as iva_compras_1,
    count(*)::int as num_compras,
    count(*) filter (
      where c.total > 0 and c.total_impuesto = 0 and c.impuesto_iva_pct = 0
    )::int as compras_sin_iva_desglose
  into v_compras
  from compras c
  where analytics_fecha_cr(c.fecha) between v_desde and v_hasta;

  v_iva_pagado := v_compras.iva_compras_13 + v_compras.iva_compras_1;
  v_diferencia := v_ventas.iva_cobrado - v_iva_pagado;

  return jsonb_build_object(
    'periodo', jsonb_build_object(
      'anio', p_anio,
      'mes', p_mes,
      'desde', v_desde,
      'hasta', v_hasta
    ),
    'ventas', jsonb_build_object(
      'total_vendido', v_ventas.total_vendido,
      'iva_cobrado', v_ventas.iva_cobrado,
      'num_facturas', v_ventas.num_facturas
    ),
    'compras', jsonb_build_object(
      'total_comprado', v_compras.total_comprado,
      'iva_compras_13', v_compras.iva_compras_13,
      'iva_compras_1', v_compras.iva_compras_1,
      'num_compras', v_compras.num_compras,
      'compras_sin_iva_desglose', v_compras.compras_sin_iva_desglose
    ),
    'resultado', jsonb_build_object(
      'iva_cobrado', v_ventas.iva_cobrado,
      'iva_pagado', v_iva_pagado,
      'diferencia_iva', v_diferencia
    ),
    'generado_en', now()
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Reporte anual: ventas, compras, gastos, salarios estimados, ganancia
-- ---------------------------------------------------------------------------
create or replace function reporte_contador_anual(p_anio int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_desde date;
  v_hasta date;
  v_ventas_total numeric(12,2);
  v_compras_mercaderia numeric(12,2);
  v_gastos_operativos numeric(12,2);
  v_salarios_estimados numeric(12,2);
  v_ganancia numeric(12,2);
begin
  perform assert_contador_reportes_access();

  if p_anio < 2000 or p_anio > 2100 then
    raise exception 'Año inválido';
  end if;

  v_desde := make_date(p_anio, 1, 1);
  v_hasta := make_date(p_anio, 12, 31);

  select coalesce(sum(f.total_comprobante), 0)::numeric(12,2)
  into v_ventas_total
  from facturas f
  where f.estado = 'cobrada'
    and analytics_fecha_cr(f.fecha_emision) between v_desde and v_hasta;

  select
    coalesce(sum(c.total) filter (where c.categoria_gasto = 'mercaderia'), 0)::numeric(12,2),
    coalesce(sum(c.total) filter (where c.categoria_gasto <> 'mercaderia'), 0)::numeric(12,2)
  into v_compras_mercaderia, v_gastos_operativos
  from compras c
  where analytics_fecha_cr(c.fecha) between v_desde and v_hasta;

  select coalesce(sum(
    round(
      (extract(epoch from (pr.hora_salida - pr.hora_entrada)) / 3600.0)
      * coalesce(u.tarifa_hora, 0),
      0
    )
  ), 0)::numeric(12,2)
  into v_salarios_estimados
  from planilla_registros pr
  join usuarios u on u.id = pr.usuario_id
  where pr.fecha between v_desde and v_hasta
    and pr.hora_entrada is not null
    and pr.hora_salida is not null;

  v_ganancia := v_ventas_total - v_compras_mercaderia - v_gastos_operativos - v_salarios_estimados;

  return jsonb_build_object(
    'periodo', jsonb_build_object(
      'anio', p_anio,
      'desde', v_desde,
      'hasta', v_hasta
    ),
    'ventas_total', v_ventas_total,
    'compras_mercaderia', v_compras_mercaderia,
    'gastos_operativos', v_gastos_operativos,
    'salarios_estimados', v_salarios_estimados,
    'ganancia_aproximada', v_ganancia,
    'generado_en', now()
  );
end;
$$;

grant execute on function assert_contador_reportes_access() to authenticated;
grant execute on function reporte_contador_mensual(int, int) to authenticated;
grant execute on function reporte_contador_anual(int) to authenticated;
