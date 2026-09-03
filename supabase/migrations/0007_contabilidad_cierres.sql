-- ============================================================================
-- 0007: Contabilidad — turnos de caja y cierres diarios
-- ============================================================================

create type estado_turno as enum ('abierto', 'cerrado');

create table turnos_caja (
  id uuid primary key default gen_random_uuid(),
  cajero_id uuid not null references usuarios(id),
  abierto_en timestamptz not null default now(),
  cerrado_en timestamptz,
  monto_apertura numeric(12,2) not null default 0,
  monto_esperado numeric(12,2),
  monto_contado numeric(12,2),
  diferencia numeric(12,2),
  estado estado_turno not null default 'abierto'
);

create table cierres_diarios (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  total_ventas numeric(12,2) not null default 0,
  total_iva numeric(12,2) not null default 0,
  total_efectivo numeric(12,2) not null default 0,
  total_tarjeta numeric(12,2) not null default 0,
  total_sinpe numeric(12,2) not null default 0,
  total_facturado int not null default 0,
  total_anulado int not null default 0,
  generado_por uuid references usuarios(id),
  generado_en timestamptz not null default now()
);

create index idx_turnos_cajero on turnos_caja(cajero_id);
create index idx_turnos_estado on turnos_caja(estado);

-- ---------------------------------------------------------------------------
-- Funcion RPC: calcula cuanto deberia haber en caja para un turno,
-- sumando los pagos registrados mientras el turno estuvo abierto.
-- ---------------------------------------------------------------------------
create or replace function calcular_monto_esperado_turno(p_turno_id uuid)
returns numeric
language plpgsql
security definer
as $$
declare
  v_turno turnos_caja;
  v_total numeric(12,2);
begin
  select * into v_turno from turnos_caja where id = p_turno_id;

  select coalesce(sum(pg.monto), 0) into v_total
  from pagos pg
  where pg.recibido_por = v_turno.cajero_id
    and pg.creado_en >= v_turno.abierto_en
    and pg.creado_en <= coalesce(v_turno.cerrado_en, now());

  return v_turno.monto_apertura + v_total;
end;
$$;

-- ---------------------------------------------------------------------------
-- Funcion RPC: genera/actualiza el cierre consolidado de un dia especifico,
-- a partir de las facturas cobradas ese dia. Se puede llamar manualmente
-- desde el modulo de Contabilidad o via un cron (pg_cron) a medianoche.
-- ---------------------------------------------------------------------------
create or replace function generar_cierre_diario(p_fecha date)
returns cierres_diarios
language plpgsql
security definer
as $$
declare
  v_cierre cierres_diarios;
begin
  insert into cierres_diarios (
    fecha, total_ventas, total_iva, total_efectivo, total_tarjeta,
    total_sinpe, total_facturado, total_anulado, generado_por
  )
  select
    p_fecha,
    coalesce(sum(f.total_comprobante) filter (where f.estado = 'cobrada'), 0),
    coalesce(sum(f.total_impuesto) filter (where f.estado = 'cobrada'), 0),
    coalesce(sum(pg.monto) filter (where pg.metodo = 'efectivo'), 0),
    coalesce(sum(pg.monto) filter (where pg.metodo = 'tarjeta'), 0),
    coalesce(sum(pg.monto) filter (where pg.metodo = 'sinpe'), 0),
    count(*) filter (where f.estado = 'cobrada'),
    count(*) filter (where f.estado = 'anulada'),
    auth.uid()
  from facturas f
  left join pagos pg on pg.factura_id = f.id
  where f.fecha_emision::date = p_fecha
  on conflict (fecha) do update set
    total_ventas = excluded.total_ventas,
    total_iva = excluded.total_iva,
    total_efectivo = excluded.total_efectivo,
    total_tarjeta = excluded.total_tarjeta,
    total_sinpe = excluded.total_sinpe,
    total_facturado = excluded.total_facturado,
    total_anulado = excluded.total_anulado,
    generado_en = now()
  returning * into v_cierre;

  return v_cierre;
end;
$$;
