-- ============================================================================
-- 0005: Pedidos, items de pedido y comandas (cocina)
-- ============================================================================

create type estado_pedido as enum ('abierto', 'enviado', 'en_preparacion', 'servido', 'cerrado', 'anulado');
create type tipo_pedido as enum ('salon', 'para_llevar', 'delivery');
create type estado_item_cocina as enum ('pendiente', 'en_preparacion', 'listo', 'entregado');

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid references mesas(id),
  mesero_id uuid not null references usuarios(id),
  cliente_id uuid, -- fk se agrega en 0006 cuando exista la tabla clientes
  tipo tipo_pedido not null default 'salon',
  estado estado_pedido not null default 'abierto',
  notas text,
  creado_en timestamptz not null default now(),
  cerrado_en timestamptz
);

create table pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  producto_id uuid not null references productos(id),
  cantidad int not null check (cantidad > 0),
  precio_unitario numeric(12,2), -- se congela al momento de facturar; puede ir null mientras esta abierto
  notas text,
  estado_cocina estado_item_cocina not null default 'pendiente'
);

create table comandas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  estacion text not null, -- 'sushi_bar' | 'cocina_caliente' | 'bebidas'
  items jsonb not null,
  estado text not null default 'pendiente', -- pendiente | en_preparacion | lista
  impresa_en timestamptz,
  creada_en timestamptz not null default now()
);

create index idx_pedidos_mesa on pedidos(mesa_id);
create index idx_pedidos_estado on pedidos(estado);
create index idx_pedido_items_pedido on pedido_items(pedido_id);
create index idx_comandas_pedido on comandas(pedido_id);
create index idx_comandas_estado on comandas(estado);

-- ---------------------------------------------------------------------------
-- Trigger: al pasar un pedido a estado 'enviado', generar automaticamente
-- las comandas agrupadas por estacion de cocina (segun la categoria del
-- producto). Esto asegura que "enviar a cocina" y "generar comanda" sean
-- una sola operacion atomica, sin depender de una segunda llamada del cliente.
-- ---------------------------------------------------------------------------
create or replace function generar_comandas_al_enviar()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.estado = 'enviado' and old.estado is distinct from 'enviado' then

    insert into comandas (pedido_id, estacion, items)
    select
      new.id,
      coalesce(cm.nombre, 'general') as estacion,
      jsonb_agg(jsonb_build_object(
        'pedido_item_id', pi.id,
        'producto', p.nombre,
        'cantidad', pi.cantidad,
        'notas', pi.notas
      ))
    from pedido_items pi
    join productos p on p.id = pi.producto_id
    left join categorias_menu cm on cm.id = p.categoria_id
    where pi.pedido_id = new.id
    group by coalesce(cm.nombre, 'general');

  end if;
  return new;
end;
$$;

create trigger trg_generar_comandas
  after update on pedidos
  for each row execute function generar_comandas_al_enviar();
