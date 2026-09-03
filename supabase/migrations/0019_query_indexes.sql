-- ============================================================================
-- 0019: Indices operativos + merma atomica
-- ============================================================================

-- Pedidos activos por mesa / para llevar
create index if not exists idx_pedidos_mesa_activo
  on pedidos(mesa_id, creado_en desc)
  where estado in ('abierto', 'enviado', 'en_preparacion', 'servido');

create index if not exists idx_pedidos_para_llevar_activo
  on pedidos(creado_en desc)
  where tipo = 'para_llevar' and mesa_id is null
    and estado in ('abierto', 'enviado', 'en_preparacion', 'servido');

-- Comandas pendientes en cocina
create index if not exists idx_comandas_pendientes
  on comandas(creada_en asc)
  where estado not in ('lista', 'anulada');

-- Turno de caja abierto
create index if not exists idx_turnos_abierto
  on turnos_caja(id)
  where estado = 'abierto';

-- Merma: insert + ajuste de stock en una transaccion
create or replace function registrar_merma(
  p_insumo_id uuid,
  p_cantidad numeric,
  p_motivo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cantidad numeric := abs(p_cantidad);
begin
  if v_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor a cero';
  end if;

  insert into movimientos_inventario (insumo_id, tipo, cantidad, creado_por, nota)
  values (p_insumo_id, 'merma', -v_cantidad, auth.uid(), p_motivo);

  update insumos
  set stock_actual = stock_actual - v_cantidad
  where id = p_insumo_id;
end;
$$;

grant execute on function registrar_merma(uuid, numeric, text) to authenticated;
