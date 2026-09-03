-- ============================================================================
-- 0010: Generar comandas solo para items nuevos (pedido ya enviado)
-- ============================================================================

create or replace function public.generar_comandas_para_items(p_pedido_id uuid, p_item_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_item_ids is null or array_length(p_item_ids, 1) is null then
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
    and pi.id = any(p_item_ids)
  group by coalesce(cm.nombre, 'general');
end;
$$;
