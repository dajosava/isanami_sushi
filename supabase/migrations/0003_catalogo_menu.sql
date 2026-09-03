-- ============================================================================
-- 0003: Catalogo de menu (categorias, productos, mesas)
-- ============================================================================

create table categorias_menu (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  orden int not null default 0
);

create type tipo_producto as enum ('plato', 'bebida', 'combo');

create table productos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias_menu(id) on delete set null,
  nombre text not null,
  descripcion text,
  precio_venta numeric(12,2) not null check (precio_venta >= 0),
  impuesto_iva_pct numeric(5,2) not null default 13,
  tipo tipo_producto not null default 'plato',
  activo boolean not null default true,
  imagen_url text,
  creado_en timestamptz not null default now()
);

create type estado_mesa as enum ('libre', 'ocupada', 'reservada', 'en_cuenta');

create table mesas (
  id uuid primary key default gen_random_uuid(),
  numero int not null unique,
  zona text,
  capacidad int not null default 4,
  estado estado_mesa not null default 'libre'
);

create index idx_productos_categoria on productos(categoria_id);
create index idx_productos_activo on productos(activo);
