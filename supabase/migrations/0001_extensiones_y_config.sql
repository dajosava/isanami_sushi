-- ============================================================================
-- 0001: Extensiones y configuracion general del restaurante
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Configuracion unica del restaurante (una sola fila logica)
create table restaurante_config (
  id uuid primary key default gen_random_uuid(),
  nombre_comercial text not null default 'Isanami Sushi',
  razon_social text,
  cedula_juridica text,
  provincia text default 'Guanacaste',
  canton text default 'Hojancha',
  distrito text,
  barrio text,
  senas_exactas text,
  telefono text,
  email_facturacion text,
  consecutivo_comprobante_actual bigint not null default 0,
  creado_en timestamptz not null default now()
);

comment on table restaurante_config is 'Fila unica de configuracion general. La facturacion electronica fiscal NO se maneja aqui; la resuelve un sistema externo del cliente.';

insert into restaurante_config (nombre_comercial, canton, provincia)
values ('Isanami Sushi', 'Hojancha', 'Guanacaste');
