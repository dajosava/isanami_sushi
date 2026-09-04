-- ============================================================================
-- 0020: Permitir quitar items de pedido + limpiar comandas
-- ============================================================================

-- Faltaba política DELETE: el borrado fallaba en silencio por RLS
create policy "pedido_items_eliminar_mesero_cajero" on pedido_items
  for delete using (auth_rol() in ('admin', 'gerente', 'mesero', 'cajero'));

-- Quitar item pendiente y sacarlo de comandas abiertas
create or replace function eliminar_pedido_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item pedido_items%rowtype;
  v_pedido pedidos%rowtype;
  v_restantes int;
begin
  if auth_rol() not in ('admin', 'gerente', 'mesero', 'cajero') then
    raise exception 'No autorizado para quitar items del pedido';
  end if;

  select * into v_item from pedido_items where id = p_item_id for update;
  if not found then
    raise exception 'Item no encontrado';
  end if;

  if v_item.estado_cocina not in ('pendiente', 'en_preparacion') then
    raise exception 'Solo se pueden quitar items pendientes o en preparacion';
  end if;

  select * into v_pedido from pedidos where id = v_item.pedido_id for update;
  if not found then
    raise exception 'Pedido no encontrado';
  end if;

  if v_pedido.estado in ('cerrado', 'anulado') then
    raise exception 'El pedido ya no admite cambios';
  end if;

  -- Sacar el item de comandas abiertas
  update comandas c
  set items = coalesce((
    select jsonb_agg(elem)
    from jsonb_array_elements(c.items) elem
    where (elem->>'pedido_item_id')::uuid is distinct from p_item_id
  ), '[]'::jsonb)
  where c.pedido_id = v_item.pedido_id
    and c.estado not in ('lista', 'anulada')
    and exists (
      select 1
      from jsonb_array_elements(c.items) elem
      where (elem->>'pedido_item_id')::uuid = p_item_id
    );

  update comandas
  set estado = 'anulada'
  where pedido_id = v_item.pedido_id
    and estado not in ('lista', 'anulada')
    and items = '[]'::jsonb;

  delete from pedido_items where id = p_item_id;

  select count(*) into v_restantes
  from pedido_items
  where pedido_id = v_item.pedido_id;

  return jsonb_build_object(
    'pedido_id', v_item.pedido_id,
    'restantes', v_restantes,
    'mesa_id', v_pedido.mesa_id,
    'tipo', v_pedido.tipo
  );
end;
$$;

grant execute on function eliminar_pedido_item(uuid) to authenticated;
