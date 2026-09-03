-- ============================================================================
-- 0018: Optimizacion analitica — indices, filtros indexables, RPC unificado
-- ============================================================================

-- Rango timestamptz en zona Costa Rica (limite superior exclusivo)
create or replace function analytics_bounds_cr(p_desde date, p_hasta date)
returns table(desde_ts timestamptz, hasta_ts timestamptz)
language sql
immutable
as $$
  select
    (p_desde::timestamp at time zone 'America/Costa_Rica') as desde_ts,
    ((p_hasta + 1)::timestamp at time zone 'America/Costa_Rica') as hasta_ts;
$$;

-- Indices para consultas analiticas
create index if not exists idx_facturas_estado_fecha on facturas(estado, fecha_emision desc);
create index if not exists idx_facturas_pedido on facturas(pedido_id);
create index if not exists idx_factura_items_factura on factura_items(factura_id);
create index if not exists idx_factura_items_producto on factura_items(producto_id);
create index if not exists idx_pagos_creado on pagos(creado_en);
create index if not exists idx_pagos_recibido_creado on pagos(recibido_por, creado_en);
create index if not exists idx_pedidos_cerrado on pedidos(cerrado_en) where cerrado_en is not null;
create index if not exists idx_pedidos_tipo on pedidos(tipo);

-- Baja rotacion: solo productos vendidos (no escaneo de catalogo completo)
create or replace function analytics_baja_rotacion(
  p_desde date,
  p_hasta date,
  p_limite int default 10,
  p_canal text default null
)
returns table(
  producto_id uuid,
  nombre text,
  cantidad bigint,
  ingresos numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_analytics_access();
  return query
  select
    pr.id as producto_id,
    pr.nombre,
    sum(fi.cantidad)::bigint as cantidad,
    coalesce(sum(fi.monto_total), 0)::numeric as ingresos
  from factura_items fi
  join facturas f on f.id = fi.factura_id
  join pedidos p on p.id = f.pedido_id
  join productos pr on pr.id = fi.producto_id
  cross join analytics_bounds_cr(p_desde, p_hasta) b
  where f.estado = 'cobrada'
    and f.fecha_emision >= b.desde_ts
    and f.fecha_emision < b.hasta_ts
    and (p_canal is null or p.tipo::text = p_canal)
  group by pr.id, pr.nombre
  order by cantidad asc
  limit p_limite;
end;
$$;

-- KPIs con filtro indexable
create or replace function analytics_kpis(
  p_desde date,
  p_hasta date,
  p_canal text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  perform assert_analytics_access();

  with ventas as (
    select f.*
    from facturas f
    join pedidos p on p.id = f.pedido_id
    cross join analytics_bounds_cr(p_desde, p_hasta) b
    where f.fecha_emision >= b.desde_ts
      and f.fecha_emision < b.hasta_ts
      and (p_canal is null or p.tipo::text = p_canal)
  ),
  costos as (
    select coalesce(sum(fi.cantidad * pc.costo_unitario), 0) as total
    from factura_items fi
    join ventas v on v.id = fi.factura_id and v.estado = 'cobrada'
    left join lateral (
      select coalesce(sum(r.cantidad_requerida * i.costo_unitario_promedio), 0) as costo_unitario
      from recetas r
      join insumos i on i.id = r.insumo_id
      where r.producto_id = fi.producto_id
    ) pc on true
  )
  select jsonb_build_object(
    'ingresos_brutos', coalesce(sum(v.total_comprobante) filter (where v.estado = 'cobrada'), 0),
    'ingresos_netos', coalesce(sum(v.subtotal) filter (where v.estado = 'cobrada'), 0),
    'impuesto_total', coalesce(sum(v.total_impuesto) filter (where v.estado = 'cobrada'), 0),
    'num_ordenes', count(*) filter (where v.estado = 'cobrada'),
    'ticket_promedio', coalesce(avg(v.total_comprobante) filter (where v.estado = 'cobrada'), 0),
    'propinas', 0,
    'costo_estimado', (select total from costos),
    'facturas_anuladas', count(*) filter (where v.estado = 'anulada')
  ) into v
  from ventas v;

  return v;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC unificado: una sola ida a la BD para todo el dashboard
-- ---------------------------------------------------------------------------
create or replace function analytics_dashboard(
  p_desde date,
  p_hasta date,
  p_canal text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev_desde date;
  v_prev_hasta date;
  v_dias int;
  v jsonb;
begin
  perform assert_analytics_access();

  v_dias := (p_hasta - p_desde) + 1;
  v_prev_hasta := p_desde - 1;
  v_prev_desde := v_prev_hasta - (v_dias - 1);

  with bounds as (
    select * from analytics_bounds_cr(p_desde, p_hasta)
  ),
  prev_bounds as (
    select * from analytics_bounds_cr(v_prev_desde, v_prev_hasta)
  ),
  facturas_periodo as (
    select
      f.id,
      f.pedido_id,
      f.estado,
      f.fecha_emision,
      f.total_comprobante,
      f.subtotal,
      f.total_impuesto,
      p.tipo as canal_pedido,
      p.mesero_id,
      p.mesa_id,
      analytics_fecha_cr(f.fecha_emision) as fecha_cr,
      extract(hour from timezone('America/Costa_Rica', f.fecha_emision))::int as hora_cr,
      extract(dow from analytics_fecha_cr(f.fecha_emision))::int as dow_cr,
      trim(to_char(analytics_fecha_cr(f.fecha_emision), 'TMDay')) as dow_nombre
    from facturas f
    join pedidos p on p.id = f.pedido_id
    cross join bounds b
    where f.fecha_emision >= b.desde_ts
      and f.fecha_emision < b.hasta_ts
      and (p_canal is null or p.tipo::text = p_canal)
  ),
  cobradas as (
    select * from facturas_periodo where estado = 'cobrada'
  ),
  facturas_prev as (
    select f.estado, f.total_comprobante, f.subtotal, f.total_impuesto
    from facturas f
    join pedidos p on p.id = f.pedido_id
    cross join prev_bounds b
    where f.fecha_emision >= b.desde_ts
      and f.fecha_emision < b.hasta_ts
      and (p_canal is null or p.tipo::text = p_canal)
  ),
  costos as (
    select coalesce(sum(fi.cantidad * pc.costo_unitario), 0) as total
    from factura_items fi
    join cobradas c on c.id = fi.factura_id
    left join lateral (
      select coalesce(sum(r.cantidad_requerida * i.costo_unitario_promedio), 0) as costo_unitario
      from recetas r
      join insumos i on i.id = r.insumo_id
      where r.producto_id = fi.producto_id
    ) pc on true
  )
  select jsonb_build_object(
    'kpis_actual', (
      select jsonb_build_object(
        'ingresos_brutos', coalesce(sum(total_comprobante), 0),
        'ingresos_netos', coalesce(sum(subtotal), 0),
        'impuesto_total', coalesce(sum(total_impuesto), 0),
        'num_ordenes', count(*),
        'ticket_promedio', coalesce(avg(total_comprobante), 0),
        'propinas', 0,
        'costo_estimado', (select total from costos),
        'facturas_anuladas', (select count(*) from facturas_periodo where estado = 'anulada')
      )
      from cobradas
    ),
    'kpis_anterior', (
      select jsonb_build_object(
        'ingresos_brutos', coalesce(sum(total_comprobante) filter (where estado = 'cobrada'), 0),
        'ingresos_netos', coalesce(sum(subtotal) filter (where estado = 'cobrada'), 0),
        'impuesto_total', coalesce(sum(total_impuesto) filter (where estado = 'cobrada'), 0),
        'num_ordenes', count(*) filter (where estado = 'cobrada'),
        'ticket_promedio', coalesce(avg(total_comprobante) filter (where estado = 'cobrada'), 0),
        'propinas', 0,
        'costo_estimado', 0,
        'facturas_anuladas', count(*) filter (where estado = 'anulada')
      )
      from facturas_prev
    ),
    'ventas_por_dia', coalesce((
      select jsonb_agg(jsonb_build_object(
        'fecha', fecha_cr,
        'total', total,
        'ordenes', ordenes
      ) order by fecha_cr)
      from (
        select fecha_cr, sum(total_comprobante)::numeric as total, count(*)::bigint as ordenes
        from cobradas
        group by fecha_cr
      ) d
    ), '[]'::jsonb),
    'ventas_por_hora', coalesce((
      select jsonb_agg(jsonb_build_object(
        'hora', hora_cr,
        'total', total,
        'ordenes', ordenes
      ) order by hora_cr)
      from (
        select hora_cr, sum(total_comprobante)::numeric as total, count(*)::bigint as ordenes
        from cobradas
        group by hora_cr
      ) h
    ), '[]'::jsonb),
    'ventas_dia_semana', coalesce((
      select jsonb_agg(jsonb_build_object(
        'dia_semana', dow_cr,
        'nombre', dow_nombre,
        'total', total,
        'ordenes', ordenes
      ) order by dow_cr)
      from (
        select dow_cr, dow_nombre, sum(total_comprobante)::numeric as total, count(*)::bigint as ordenes
        from cobradas
        group by dow_cr, dow_nombre
      ) ds
    ), '[]'::jsonb),
    'top_productos', coalesce((
      select jsonb_agg(row_to_json(t)::jsonb)
      from (
        select
          pr.id as producto_id,
          pr.nombre,
          coalesce(cm.nombre, 'Sin categoria') as categoria,
          sum(fi.cantidad)::bigint as cantidad,
          coalesce(sum(fi.monto_total), 0)::numeric as ingresos,
          coalesce(sum(fi.cantidad * pc.costo_unitario), 0)::numeric as costo_estimado
        from factura_items fi
        join cobradas c on c.id = fi.factura_id
        join productos pr on pr.id = fi.producto_id
        left join categorias_menu cm on cm.id = pr.categoria_id
        left join lateral (
          select coalesce(sum(r.cantidad_requerida * i.costo_unitario_promedio), 0) as costo_unitario
          from recetas r
          join insumos i on i.id = r.insumo_id
          where r.producto_id = fi.producto_id
        ) pc on true
        group by pr.id, pr.nombre, cm.nombre
        order by cantidad desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'baja_rotacion', coalesce((
      select jsonb_agg(row_to_json(t)::jsonb)
      from (
        select
          pr.id as producto_id,
          pr.nombre,
          sum(fi.cantidad)::bigint as cantidad,
          coalesce(sum(fi.monto_total), 0)::numeric as ingresos
        from factura_items fi
        join cobradas c on c.id = fi.factura_id
        join productos pr on pr.id = fi.producto_id
        group by pr.id, pr.nombre
        order by cantidad asc
        limit 10
      ) t
    ), '[]'::jsonb),
    'por_categoria', coalesce((
      select jsonb_agg(jsonb_build_object(
        'categoria', categoria,
        'cantidad', cantidad,
        'ingresos', ingresos
      ) order by ingresos desc)
      from (
        select
          coalesce(cm.nombre, 'Sin categoria') as categoria,
          sum(fi.cantidad)::bigint as cantidad,
          coalesce(sum(fi.monto_total), 0)::numeric as ingresos
        from factura_items fi
        join cobradas c on c.id = fi.factura_id
        join productos pr on pr.id = fi.producto_id
        left join categorias_menu cm on cm.id = pr.categoria_id
        group by 1
      ) cat
    ), '[]'::jsonb),
    'por_mesero', coalesce((
      select jsonb_agg(jsonb_build_object(
        'mesero_id', mesero_id,
        'mesero', mesero,
        'ordenes', ordenes,
        'ingresos', ingresos
      ) order by ingresos desc)
      from (
        select
          u.id as mesero_id,
          u.nombre as mesero,
          count(distinct c.id)::bigint as ordenes,
          coalesce(sum(c.total_comprobante), 0)::numeric as ingresos
        from cobradas c
        join usuarios u on u.id = c.mesero_id
        group by u.id, u.nombre
      ) m
    ), '[]'::jsonb),
    'por_mesa', coalesce((
      select jsonb_agg(jsonb_build_object(
        'mesa_numero', mesa_numero,
        'zona', zona,
        'ordenes', ordenes,
        'ingresos', ingresos
      ) order by ingresos desc)
      from (
        select
          m.numero as mesa_numero,
          coalesce(m.zona, '—') as zona,
          count(distinct c.id)::bigint as ordenes,
          coalesce(sum(c.total_comprobante), 0)::numeric as ingresos
        from cobradas c
        left join mesas m on m.id = c.mesa_id
        group by m.numero, m.zona
      ) ms
    ), '[]'::jsonb),
    'tiempo_mesa', (
      select jsonb_build_object(
        'promedio_minutos', coalesce(avg(extract(epoch from (p.cerrado_en - p.creado_en)) / 60.0), 0),
        'pedidos_cerrados', count(*)
      )
      from pedidos p
      cross join bounds b
      where p.estado = 'cerrado'
        and p.cerrado_en is not null
        and p.cerrado_en >= b.desde_ts
        and p.cerrado_en < b.hasta_ts
        and (p_canal is null or p.tipo::text = p_canal)
    ),
    'pagos_metodo', coalesce((
      select jsonb_agg(jsonb_build_object(
        'metodo', metodo,
        'total', total,
        'transacciones', transacciones
      ) order by total desc)
      from (
        select
          pg.metodo::text as metodo,
          coalesce(sum(pg.monto), 0)::numeric as total,
          count(*)::bigint as transacciones
        from pagos pg
        join cobradas c on c.id = pg.factura_id
        cross join bounds b
        where pg.creado_en >= b.desde_ts
          and pg.creado_en < b.hasta_ts
        group by pg.metodo
      ) pm
    ), '[]'::jsonb),
    'conciliacion', coalesce((
      select jsonb_agg(jsonb_build_object(
        'turno_id', turno_id,
        'cajero', cajero,
        'abierto_en', abierto_en,
        'cerrado_en', cerrado_en,
        'monto_esperado', monto_esperado,
        'monto_contado', monto_contado,
        'diferencia', diferencia,
        'total_pagos', total_pagos
      ) order by abierto_en desc)
      from (
        select
          t.id as turno_id,
          u.nombre as cajero,
          t.abierto_en,
          t.cerrado_en,
          t.monto_esperado,
          t.monto_contado,
          t.diferencia,
          coalesce(sum(pg.monto), 0)::numeric as total_pagos
        from turnos_caja t
        join usuarios u on u.id = t.cajero_id
        cross join bounds b
        left join pagos pg on pg.recibido_por = t.cajero_id
          and pg.creado_en >= t.abierto_en
          and pg.creado_en <= coalesce(t.cerrado_en, now())
        where t.abierto_en >= b.desde_ts and t.abierto_en < b.hasta_ts
           or (t.cerrado_en is not null and t.cerrado_en >= b.desde_ts and t.cerrado_en < b.hasta_ts)
        group by t.id, u.nombre, t.abierto_en, t.cerrado_en, t.monto_esperado, t.monto_contado, t.diferencia
      ) cc
    ), '[]'::jsonb)
  ) into v;

  return v;
end;
$$;

grant execute on function analytics_bounds_cr(date, date) to authenticated;
grant execute on function analytics_dashboard(date, date, text) to authenticated;
