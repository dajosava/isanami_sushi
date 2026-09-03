-- ============================================================================
-- 0004: Inventario (insumos, recetas, movimientos, proveedores, compras)
-- ============================================================================

create table unidades_medida (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  abreviatura text not null
);

insert into unidades_medida (nombre, abreviatura) values
  ('kilogramo', 'kg'), ('gramo', 'g'), ('litro', 'l'),
  ('mililitro', 'ml'), ('unidad', 'u');

create table proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cedula text,
  telefono text,
  email text
);

create table insumos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  unidad_medida_id uuid not null references unidades_medida(id),
  stock_actual numeric(12,3) not null default 0,
  stock_minimo numeric(12,3) not null default 0,
  costo_unitario_promedio numeric(12,4) not null default 0,
  proveedor_principal_id uuid references proveedores(id)
);

-- Receta: cuanto de cada insumo consume un producto del menu
create table recetas (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id) on delete cascade,
  insumo_id uuid not null references insumos(id) on delete restrict,
  cantidad_requerida numeric(12,3) not null check (cantidad_requerida > 0),
  unidad_medida_id uuid not null references unidades_medida(id),
  unique (producto_id, insumo_id)
);

create type tipo_movimiento_inventario as enum ('entrada_compra', 'salida_venta', 'merma', 'ajuste');

create table movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  insumo_id uuid not null references insumos(id),
  tipo tipo_movimiento_inventario not null,
  cantidad numeric(12,3) not null, -- positivo = entrada, negativo = salida
  costo_unitario numeric(12,4),
  referencia_id uuid, -- pedido_id, compra_id, etc. segun el tipo
  creado_por uuid references usuarios(id),
  creado_en timestamptz not null default now()
);

create table compras (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references proveedores(id),
  numero_factura_proveedor text,
  fecha timestamptz not null default now(),
  total numeric(12,2) not null default 0,
  estado text not null default 'recibida'
);

create table compras_items (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references compras(id) on delete cascade,
  insumo_id uuid not null references insumos(id),
  cantidad numeric(12,3) not null check (cantidad > 0),
  costo_unitario numeric(12,4) not null check (costo_unitario >= 0)
);

create index idx_movimientos_insumo on movimientos_inventario(insumo_id);
create index idx_recetas_producto on recetas(producto_id);

-- ---------------------------------------------------------------------------
-- Trigger: al insertar un item de compra, sumar stock, recalcular costo
-- promedio ponderado, y dejar registro en movimientos_inventario.
-- ---------------------------------------------------------------------------
create or replace function procesar_entrada_compra()
returns trigger
language plpgsql
security definer
as $$
declare
  v_stock_previo numeric(12,3);
  v_costo_previo numeric(12,4);
  v_nuevo_costo_promedio numeric(12,4);
begin
  select stock_actual, costo_unitario_promedio
    into v_stock_previo, v_costo_previo
    from insumos where id = new.insumo_id
    for update;

  -- costo promedio ponderado
  if (v_stock_previo + new.cantidad) > 0 then
    v_nuevo_costo_promedio := (
      (v_stock_previo * v_costo_previo) + (new.cantidad * new.costo_unitario)
    ) / (v_stock_previo + new.cantidad);
  else
    v_nuevo_costo_promedio := new.costo_unitario;
  end if;

  update insumos
    set stock_actual = v_stock_previo + new.cantidad,
        costo_unitario_promedio = v_nuevo_costo_promedio
    where id = new.insumo_id;

  insert into movimientos_inventario (insumo_id, tipo, cantidad, costo_unitario, referencia_id)
  values (new.insumo_id, 'entrada_compra', new.cantidad, new.costo_unitario, new.compra_id);

  return new;
end;
$$;

create trigger trg_entrada_compra
  after insert on compras_items
  for each row execute function procesar_entrada_compra();

-- ---------------------------------------------------------------------------
-- Funcion RPC: descuenta el inventario segun la receta de un producto vendido.
-- Invocada desde `lib/inventario/descuento-receta.ts` via supabase.rpc(...)
-- ---------------------------------------------------------------------------
create or replace function descontar_inventario_por_venta(
  p_producto_id uuid,
  p_cantidad_vendida numeric,
  p_pedido_id uuid,
  p_usuario_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  r record;
begin
  for r in
    select insumo_id, cantidad_requerida
    from recetas
    where producto_id = p_producto_id
  loop
    update insumos
      set stock_actual = stock_actual - (r.cantidad_requerida * p_cantidad_vendida)
      where id = r.insumo_id;

    insert into movimientos_inventario (insumo_id, tipo, cantidad, referencia_id, creado_por)
    values (
      r.insumo_id,
      'salida_venta',
      -(r.cantidad_requerida * p_cantidad_vendida),
      p_pedido_id,
      p_usuario_id
    );
  end loop;
end;
$$;
