-- ============================================================================
-- 0011: Auditoria de anulaciones + reversa de inventario
-- ============================================================================

create table if not exists public.factura_anulaciones (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references facturas(id) on delete cascade,
  motivo text not null,
  anulado_por uuid references usuarios(id),
  creado_en timestamptz not null default now()
);

create index if not exists idx_factura_anulaciones_factura on factura_anulaciones(factura_id);

create or replace function public.revertir_inventario_por_venta(
  p_producto_id uuid,
  p_cantidad_vendida numeric,
  p_pedido_id uuid,
  p_usuario_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
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
      set stock_actual = stock_actual + (r.cantidad_requerida * p_cantidad_vendida)
      where id = r.insumo_id;

    insert into movimientos_inventario (insumo_id, tipo, cantidad, referencia_id, creado_por)
    values (
      r.insumo_id,
      'ajuste',
      (r.cantidad_requerida * p_cantidad_vendida),
      p_pedido_id,
      p_usuario_id
    );
  end loop;
end;
$$;

create or replace function public.anular_comprobante_venta(p_factura_id uuid, p_motivo text)
returns facturas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_factura facturas;
  r record;
  v_usuario_id uuid := auth.uid();
begin
  select * into v_factura from facturas where id = p_factura_id for update;

  if not found then
    raise exception 'Comprobante no encontrado';
  end if;

  if v_factura.estado = 'anulada' then
    raise exception 'El comprobante ya esta anulado';
  end if;

  for r in
    select fi.producto_id, fi.cantidad
    from factura_items fi
    where fi.factura_id = p_factura_id
  loop
    perform revertir_inventario_por_venta(r.producto_id, r.cantidad, v_factura.pedido_id, v_usuario_id);
  end loop;

  update facturas
    set estado = 'anulada'
    where id = p_factura_id
    returning * into v_factura;

  insert into factura_anulaciones (factura_id, motivo, anulado_por)
  values (p_factura_id, p_motivo, v_usuario_id);

  return v_factura;
end;
$$;
