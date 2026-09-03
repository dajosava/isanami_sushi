-- ============================================================================
-- 0015: Analitica — RPCs de agregacion, snapshots de reportes, RLS
-- Zona horaria: America/Costa_Rica para cortes diarios
-- ============================================================================

create table if not exists reportes_generados (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  tipo text not null,
  desde date not null,
  hasta date not null,
  canal text,
  checksum text not null,
  payload jsonb not null,
  generado_por uuid references usuarios(id),
  generado_en timestamptz not null default now()
);

create index if not exists idx_reportes_generados_fecha on reportes_generados(generado_en desc);

alter table reportes_generados enable row level security;

create policy "reportes_generados_ver" on reportes_generados
  for select using (auth_rol() in ('admin', 'gerente', 'contador'));

create policy "reportes_generados_insertar" on reportes_generados
  for insert with check (auth_rol() in ('admin', 'gerente'));

-- ---------------------------------------------------------------------------
-- Helper: solo admin, gerente o contador
-- ---------------------------------------------------------------------------
create or replace function assert_analytics_access()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth_rol() not in ('admin', 'gerente', 'contador') then
    raise exception 'No autorizado para analitica financiera';
  end if;
end;
$$;

-- Filtro de fecha en zona Costa Rica
create or replace function analytics_fecha_cr(ts timestamptz)
returns date
language sql
immutable
as $$
  select (timezone('America/Costa_Rica', ts))::date;
$$;

-- ---------------------------------------------------------------------------
-- KPIs resumen del periodo
-- ---------------------------------------------------------------------------
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
    select f.*, p.tipo as canal_pedido
    from facturas f
    join pedidos p on p.id = f.pedido_id
    where analytics_fecha_cr(f.fecha_emision) between p_desde and p_hasta
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
-- Ventas por dia
-- ---------------------------------------------------------------------------
create or replace function analytics_ventas_por_dia(
  p_desde date,
  p_hasta date,
  p_canal text default null
)
returns table(fecha date, total numeric, ordenes bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_analytics_access();
  return query
  select
    analytics_fecha_cr(f.fecha_emision) as fecha,
    coalesce(sum(f.total_comprobante), 0)::numeric as total,
    count(*)::bigint as ordenes
  from facturas f
  join pedidos p on p.id = f.pedido_id
  where f.estado = 'cobrada'
    and analytics_fecha_cr(f.fecha_emision) between p_desde and p_hasta
    and (p_canal is null or p.tipo::text = p_canal)
  group by 1
  order by 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ventas por hora del dia (0-23)
-- ---------------------------------------------------------------------------
create or replace function analytics_ventas_por_hora(
  p_desde date,
  p_hasta date,
  p_canal text default null
)
returns table(hora int, total numeric, ordenes bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_analytics_access();
  return query
  select
    extract(hour from timezone('America/Costa_Rica', f.fecha_emision))::int as hora,
    coalesce(sum(f.total_comprobante), 0)::numeric as total,
    count(*)::bigint as ordenes
  from facturas f
  join pedidos p on p.id = f.pedido_id
  where f.estado = 'cobrada'
    and analytics_fecha_cr(f.fecha_emision) between p_desde and p_hasta
    and (p_canal is null or p.tipo::text = p_canal)
  group by 1
  order by 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ventas por dia de la semana (0=domingo)
-- ---------------------------------------------------------------------------
create or replace function analytics_ventas_dia_semana(
  p_desde date,
  p_hasta date,
  p_canal text default null
)
returns table(dia_semana int, nombre text, total numeric, ordenes bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_analytics_access();
  return query
  select
    extract(dow from analytics_fecha_cr(f.fecha_emision))::int as dia_semana,
    trim(to_char(analytics_fecha_cr(f.fecha_emision), 'TMDay')) as nombre,
    coalesce(sum(f.total_comprobante), 0)::numeric as total,
    count(*)::bigint as ordenes
  from facturas f
  join pedidos p on p.id = f.pedido_id
  where f.estado = 'cobrada'
    and analytics_fecha_cr(f.fecha_emision) between p_desde and p_hasta
    and (p_canal is null or p.tipo::text = p_canal)
  group by 1, 2
  order by 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- Top productos
-- ---------------------------------------------------------------------------
create or replace function analytics_top_productos(
  p_desde date,
  p_hasta date,
  p_limite int default 10,
  p_canal text default null
)
returns table(
  producto_id uuid,
  nombre text,
  categoria text,
  cantidad bigint,
  ingresos numeric,
  costo_estimado numeric
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
    coalesce(cm.nombre, 'Sin categoria') as categoria,
    sum(fi.cantidad)::bigint as cantidad,
    coalesce(sum(fi.monto_total), 0)::numeric as ingresos,
    coalesce(sum(fi.cantidad * pc.costo_unitario), 0)::numeric as costo_estimado
  from factura_items fi
  join facturas f on f.id = fi.factura_id
  join pedidos p on p.id = f.pedido_id
  join productos pr on pr.id = fi.producto_id
  left join categorias_menu cm on cm.id = pr.categoria_id
  left join lateral (
    select coalesce(sum(r.cantidad_requerida * i.costo_unitario_promedio), 0) as costo_unitario
    from recetas r
    join insumos i on i.id = r.insumo_id
    where r.producto_id = fi.producto_id
  ) pc on true
  where f.estado = 'cobrada'
    and analytics_fecha_cr(f.fecha_emision) between p_desde and p_hasta
    and (p_canal is null or p.tipo::text = p_canal)
  group by pr.id, pr.nombre, cm.nombre
  order by cantidad desc
  limit p_limite;
end;
$$;

-- ---------------------------------------------------------------------------
-- Productos con menor rotacion (vendidos en el periodo, orden asc)
-- ---------------------------------------------------------------------------
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
    pr.id,
    pr.nombre,
    coalesce(sum(fi.cantidad), 0)::bigint as cantidad,
    coalesce(sum(fi.monto_total), 0)::numeric as ingresos
  from productos pr
  left join factura_items fi on fi.producto_id = pr.id
  left join facturas f on f.id = fi.factura_id and f.estado = 'cobrada'
    and analytics_fecha_cr(f.fecha_emision) between p_desde and p_hasta
  left join pedidos p on p.id = f.pedido_id
    and (p_canal is null or p.tipo::text = p_canal)
  where pr.activo = true
  group by pr.id, pr.nombre
  having coalesce(sum(fi.cantidad), 0) > 0
  order by cantidad asc
  limit p_limite;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ventas por categoria
-- ---------------------------------------------------------------------------
create or replace function analytics_por_categoria(
  p_desde date,
  p_hasta date,
  p_canal text default null
)
returns table(categoria text, cantidad bigint, ingresos numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_analytics_access();
  return query
  select
    coalesce(cm.nombre, 'Sin categoria') as categoria,
    sum(fi.cantidad)::bigint as cantidad,
    coalesce(sum(fi.monto_total), 0)::numeric as ingresos
  from factura_items fi
  join facturas f on f.id = fi.factura_id
  join pedidos p on p.id = f.pedido_id
  join productos pr on pr.id = fi.producto_id
  left join categorias_menu cm on cm.id = pr.categoria_id
  where f.estado = 'cobrada'
    and analytics_fecha_cr(f.fecha_emision) between p_desde and p_hasta
    and (p_canal is null or p.tipo::text = p_canal)
  group by 1
  order by ingresos desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ventas por mesero
-- ---------------------------------------------------------------------------
create or replace function analytics_por_mesero(
  p_desde date,
  p_hasta date,
  p_canal text default null
)
returns table(mesero_id uuid, mesero text, ordenes bigint, ingresos numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_analytics_access();
  return query
  select
    u.id as mesero_id,
    u.nombre as mesero,
    count(distinct f.id)::bigint as ordenes,
    coalesce(sum(f.total_comprobante), 0)::numeric as ingresos
  from facturas f
  join pedidos p on p.id = f.pedido_id
  join usuarios u on u.id = p.mesero_id
  where f.estado = 'cobrada'
    and analytics_fecha_cr(f.fecha_emision) between p_desde and p_hasta
    and (p_canal is null or p.tipo::text = p_canal)
  group by u.id, u.nombre
  order by ingresos desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ventas por mesa / zona
-- ---------------------------------------------------------------------------
create or replace function analytics_por_mesa(
  p_desde date,
  p_hasta date,
  p_canal text default null
)
returns table(mesa_numero int, zona text, ordenes bigint, ingresos numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_analytics_access();
  return query
  select
    m.numero as mesa_numero,
    coalesce(m.zona, '—') as zona,
    count(distinct f.id)::bigint as ordenes,
    coalesce(sum(f.total_comprobante), 0)::numeric as ingresos
  from facturas f
  join pedidos p on p.id = f.pedido_id
  left join mesas m on m.id = p.mesa_id
  where f.estado = 'cobrada'
    and analytics_fecha_cr(f.fecha_emision) between p_desde and p_hasta
    and (p_canal is null or p.tipo::text = p_canal)
  group by m.numero, m.zona
  order by ingresos desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tiempo promedio de mesa (minutos)
-- ---------------------------------------------------------------------------
create or replace function analytics_tiempo_mesa(
  p_desde date,
  p_hasta date,
  p_canal text default null
)
returns table(promedio_minutos numeric, pedidos_cerrados bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_analytics_access();
  return query
  select
    coalesce(avg(extract(epoch from (p.cerrado_en - p.creado_en)) / 60.0), 0)::numeric as promedio_minutos,
    count(*)::bigint as pedidos_cerrados
  from pedidos p
  where p.estado = 'cerrado'
    and p.cerrado_en is not null
    and analytics_fecha_cr(p.cerrado_en) between p_desde and p_hasta
    and (p_canal is null or p.tipo::text = p_canal);
end;
$$;

-- ---------------------------------------------------------------------------
-- Pagos por metodo
-- ---------------------------------------------------------------------------
create or replace function analytics_pagos_metodo(
  p_desde date,
  p_hasta date,
  p_canal text default null
)
returns table(metodo text, total numeric, transacciones bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_analytics_access();
  return query
  select
    pg.metodo::text as metodo,
    coalesce(sum(pg.monto), 0)::numeric as total,
    count(*)::bigint as transacciones
  from pagos pg
  join facturas f on f.id = pg.factura_id
  join pedidos p on p.id = f.pedido_id
  where f.estado = 'cobrada'
    and analytics_fecha_cr(pg.creado_en) between p_desde and p_hasta
    and (p_canal is null or p.tipo::text = p_canal)
  group by pg.metodo
  order by total desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- Conciliacion caja: turnos vs pagos registrados
-- ---------------------------------------------------------------------------
create or replace function analytics_conciliacion_caja(
  p_desde date,
  p_hasta date
)
returns table(
  turno_id uuid,
  cajero text,
  abierto_en timestamptz,
  cerrado_en timestamptz,
  monto_esperado numeric,
  monto_contado numeric,
  diferencia numeric,
  total_pagos numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_analytics_access();
  return query
  select
    t.id as turno_id,
    u.nombre as cajero,
    t.abierto_en,
    t.cerrado_en,
    t.monto_esperado,
    t.monto_contado,
    t.diferencia,
    coalesce((
      select sum(pg.monto)
      from pagos pg
      where pg.recibido_por = t.cajero_id
        and pg.creado_en >= t.abierto_en
        and pg.creado_en <= coalesce(t.cerrado_en, now())
    ), 0)::numeric as total_pagos
  from turnos_caja t
  join usuarios u on u.id = t.cajero_id
  where analytics_fecha_cr(t.abierto_en) between p_desde and p_hasta
     or (t.cerrado_en is not null and analytics_fecha_cr(t.cerrado_en) between p_desde and p_hasta)
  order by t.abierto_en desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- Libro de ventas (detalle para exportacion)
-- ---------------------------------------------------------------------------
create or replace function analytics_libro_ventas(
  p_desde date,
  p_hasta date,
  p_canal text default null
)
returns table(
  numero_comprobante text,
  fecha_emision timestamptz,
  canal text,
  mesero text,
  mesa int,
  subtotal numeric,
  impuesto numeric,
  total numeric,
  medio_pago text,
  estado text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_analytics_access();
  return query
  select
    f.numero_comprobante,
    f.fecha_emision,
    p.tipo::text as canal,
    u.nombre as mesero,
    m.numero as mesa,
    f.subtotal,
    f.total_impuesto as impuesto,
    f.total_comprobante as total,
    f.medio_pago::text as medio_pago,
    f.estado::text as estado
  from facturas f
  join pedidos p on p.id = f.pedido_id
  join usuarios u on u.id = p.mesero_id
  left join mesas m on m.id = p.mesa_id
  where analytics_fecha_cr(f.fecha_emision) between p_desde and p_hasta
    and (p_canal is null or p.tipo::text = p_canal)
  order by f.fecha_emision;
end;
$$;

-- ---------------------------------------------------------------------------
-- Guardar snapshot inmutable de reporte
-- ---------------------------------------------------------------------------
create or replace function guardar_reporte_generado(
  p_tipo text,
  p_desde date,
  p_hasta date,
  p_canal text,
  p_payload jsonb
)
returns reportes_generados
language plpgsql
security definer
set search_path = public
as $$
declare
  v_folio text;
  v_checksum text;
  v_row reportes_generados;
begin
  if auth_rol() not in ('admin', 'gerente') then
    raise exception 'No autorizado para generar reportes';
  end if;

  v_folio := 'RPT-' || to_char(now() at time zone 'America/Costa_Rica', 'YYYYMMDD') || '-' ||
    lpad((floor(random() * 10000))::text, 4, '0');
  v_checksum := encode(digest(p_payload::text, 'sha256'), 'hex');

  insert into reportes_generados (folio, tipo, desde, hasta, canal, checksum, payload, generado_por)
  values (v_folio, p_tipo, p_desde, p_hasta, p_canal, v_checksum, p_payload, auth.uid())
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function assert_analytics_access() to authenticated;
grant execute on function analytics_kpis(date, date, text) to authenticated;
grant execute on function analytics_ventas_por_dia(date, date, text) to authenticated;
grant execute on function analytics_ventas_por_hora(date, date, text) to authenticated;
grant execute on function analytics_ventas_dia_semana(date, date, text) to authenticated;
grant execute on function analytics_top_productos(date, date, int, text) to authenticated;
grant execute on function analytics_baja_rotacion(date, date, int, text) to authenticated;
grant execute on function analytics_por_categoria(date, date, text) to authenticated;
grant execute on function analytics_por_mesero(date, date, text) to authenticated;
grant execute on function analytics_por_mesa(date, date, text) to authenticated;
grant execute on function analytics_tiempo_mesa(date, date, text) to authenticated;
grant execute on function analytics_pagos_metodo(date, date, text) to authenticated;
grant execute on function analytics_conciliacion_caja(date, date) to authenticated;
grant execute on function analytics_libro_ventas(date, date, text) to authenticated;
grant execute on function guardar_reporte_generado(text, date, date, text, jsonb) to authenticated;
