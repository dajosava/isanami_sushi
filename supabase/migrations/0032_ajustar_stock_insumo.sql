-- ============================================================================
-- 0032: Edición de stock actual y mínimo desde el listado de insumos.
-- La diferencia de stock queda registrada como movimiento tipo 'ajuste'.
-- ============================================================================

create or replace function ajustar_stock_insumo(
  p_insumo_id uuid,
  p_stock_nuevo numeric,
  p_stock_minimo numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock_previo numeric(12,3);
  v_diferencia numeric(12,3);
begin
  if auth_rol() not in ('admin', 'gerente') then
    raise exception 'Sin permiso para ajustar inventario';
  end if;

  if p_stock_nuevo is null or p_stock_nuevo < 0 then
    raise exception 'El stock actual no es válido';
  end if;

  if p_stock_minimo is null or p_stock_minimo < 0 then
    raise exception 'El stock mínimo no es válido';
  end if;

  select stock_actual into v_stock_previo
  from insumos
  where id = p_insumo_id
  for update;

  if not found then
    raise exception 'Insumo no encontrado';
  end if;

  v_diferencia := p_stock_nuevo - v_stock_previo;

  update insumos
  set stock_actual = p_stock_nuevo,
      stock_minimo = p_stock_minimo
  where id = p_insumo_id;

  if v_diferencia <> 0 then
    insert into movimientos_inventario (insumo_id, tipo, cantidad, creado_por, nota)
    values (
      p_insumo_id,
      'ajuste',
      v_diferencia,
      auth.uid(),
      'Ajuste manual desde listado de insumos'
    );
  end if;
end;
$$;

grant execute on function ajustar_stock_insumo(uuid, numeric, numeric) to authenticated;
