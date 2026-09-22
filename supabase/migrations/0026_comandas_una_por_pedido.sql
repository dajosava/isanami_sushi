-- ============================================================================
-- 0026: Una comanda por envio (toda la mesa/pedido junta)
-- Antes se agrupaba por categoria/estacion y salian varias tarjetas KDS.
-- ============================================================================

-- Unificar comandas abiertas del mismo pedido (deja la mas antigua)
do $$
declare
  r record;
  v_keep uuid;
  v_merged jsonb;
begin
  for r in
    select pedido_id
    from comandas
    where estado is distinct from 'lista'
      and estado is distinct from 'anulada'
    group by pedido_id
    having count(*) > 1
  loop
    select id
    into v_keep
    from comandas
    where pedido_id = r.pedido_id
      and estado is distinct from 'lista'
      and estado is distinct from 'anulada'
    order by creada_en asc
    limit 1;

    select coalesce(
      (
        select jsonb_agg(elem order by c.creada_en, ord)
        from comandas c
        cross join lateral jsonb_array_elements(c.items) with ordinality as t(elem, ord)
        where c.pedido_id = r.pedido_id
          and c.estado is distinct from 'lista'
          and c.estado is distinct from 'anulada'
      ),
      '[]'::jsonb
    )
    into v_merged;

    update comandas
    set items = v_merged,
        estacion = 'Cocina'
    where id = v_keep;

    delete from comandas
    where pedido_id = r.pedido_id
      and id <> v_keep
      and estado is distinct from 'lista'
      and estado is distinct from 'anulada';
  end loop;
end;
$$;

-- Primer envio (pedido abierto -> enviado): una sola comanda con todos los items
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
      'Cocina',
      jsonb_agg(jsonb_build_object(
        'pedido_item_id', pi.id,
        'producto', p.nombre,
        'cantidad', pi.cantidad,
        'notas', pi.notas
      ) order by pi.id)
    from pedido_items pi
    join productos p on p.id = pi.producto_id
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
    having count(*) > 0;

    update pedido_items
    set estado_cocina = 'en_preparacion'
    where pedido_id = new.id
      and estado_cocina = 'pendiente';

  end if;
  return new;
end;
$$;

-- Reenvios / items nuevos: una comanda con ese lote (no por categoria)
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
    'Cocina',
    jsonb_agg(jsonb_build_object(
      'pedido_item_id', pi.id,
      'producto', p.nombre,
      'cantidad', pi.cantidad,
      'notas', pi.notas
    ) order by pi.id)
  from pedido_items pi
  join productos p on p.id = pi.producto_id
  where pi.pedido_id = p_pedido_id
    and pi.id = any(v_ids);

  update pedido_items
  set estado_cocina = 'en_preparacion'
  where id = any(v_ids)
    and estado_cocina = 'pendiente';
end;
$$;

grant execute on function public.generar_comandas_para_items(uuid, uuid[]) to authenticated;
