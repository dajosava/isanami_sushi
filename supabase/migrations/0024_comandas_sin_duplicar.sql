-- ============================================================================
-- 0024: No duplicar en cocina items ya enviados
-- Al generar comandas, marcar items como en_preparacion y
-- ignorar items que ya esten en alguna comanda no anulada.
-- ============================================================================

-- Backfill: items que ya estan en comandas deben salir de "pendiente"
update pedido_items pi
set estado_cocina = 'en_preparacion'
where pi.estado_cocina = 'pendiente'
  and exists (
    select 1
    from comandas c
    cross join lateral jsonb_array_elements(c.items) elem
    where c.pedido_id = pi.pedido_id
      and c.estado is distinct from 'anulada'
      and (elem->>'pedido_item_id')::uuid = pi.id
  );

-- Primer envio (pedido abierto -> enviado)
create or replace function generar_comandas_al_enviar()
returns trigger
language plpgsql
security definer
set search_path = public
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
      and pi.estado_cocina = 'pendiente'
      and not exists (
        select 1
        from comandas c
        cross join lateral jsonb_array_elements(c.items) elem
        where c.pedido_id = new.id
          and c.estado is distinct from 'anulada'
          and (elem->>'pedido_item_id')::uuid = pi.id
      )
    group by coalesce(cm.nombre, 'general');

    update pedido_items
    set estado_cocina = 'en_preparacion'
    where pedido_id = new.id
      and estado_cocina = 'pendiente';

  end if;
  return new;
end;
$$;

-- Reenvios / items nuevos de un pedido ya enviado
create or replace function public.generar_comandas_para_items(p_pedido_id uuid, p_item_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
begin
  if p_item_ids is null or array_length(p_item_ids, 1) is null then
    return;
  end if;

  -- Solo items pendientes que aun no estan en una comanda activa
  select coalesce(array_agg(pi.id), '{}'::uuid[])
  into v_ids
  from pedido_items pi
  where pi.pedido_id = p_pedido_id
    and pi.id = any(p_item_ids)
    and pi.estado_cocina = 'pendiente'
    and not exists (
      select 1
      from comandas c
      cross join lateral jsonb_array_elements(c.items) elem
      where c.pedido_id = p_pedido_id
        and c.estado is distinct from 'anulada'
        and (elem->>'pedido_item_id')::uuid = pi.id
    );

  if v_ids is null or array_length(v_ids, 1) is null then
    return;
  end if;

  insert into comandas (pedido_id, estacion, items)
  select
    p_pedido_id,
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
  where pi.pedido_id = p_pedido_id
    and pi.id = any(v_ids)
  group by coalesce(cm.nombre, 'general');

  update pedido_items
  set estado_cocina = 'en_preparacion'
  where id = any(v_ids)
    and estado_cocina = 'pendiente';
end;
$$;

grant execute on function public.generar_comandas_para_items(uuid, uuid[]) to authenticated;
