-- ============================================================================
-- 0016: Precios con IVA incluido + 10% servicio solo en mesa (salon)
-- ============================================================================

alter table facturas
  add column if not exists total_servicio numeric(12,2) not null default 0;

create or replace function public.crear_comprobante_venta(
  p_pedido_id uuid,
  p_cliente_id uuid,
  p_medio_pago medio_pago,
  p_monto_recibido numeric
)
returns facturas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consecutivo bigint;
  v_numero_comprobante text;
  v_factura facturas;
  v_subtotal numeric(12,2) := 0;
  v_total_impuesto numeric(12,2) := 0;
  v_total_servicio numeric(12,2) := 0;
  v_tipo tipo_pedido;
  r record;
  v_usuario_id uuid := auth.uid();
  v_mesa_id uuid;
begin
  select tipo, mesa_id into v_tipo, v_mesa_id
  from pedidos
  where id = p_pedido_id;

  if v_tipo is null then
    raise exception 'Pedido no encontrado';
  end if;

  update restaurante_config
    set consecutivo_comprobante_actual = consecutivo_comprobante_actual + 1
    where id = (select id from restaurante_config order by creado_en asc limit 1)
    returning consecutivo_comprobante_actual into v_consecutivo;

  if v_consecutivo is null then
    raise exception 'No hay fila en restaurante_config';
  end if;

  v_numero_comprobante := 'ISN-' || lpad(v_consecutivo::text, 6, '0');

  insert into facturas (pedido_id, cliente_id, numero_comprobante, medio_pago)
  values (p_pedido_id, p_cliente_id, v_numero_comprobante, p_medio_pago)
  returning * into v_factura;

  for r in
    select pi.id, pi.producto_id, pi.cantidad, p.precio_venta, p.impuesto_iva_pct
    from pedido_items pi
    join productos p on p.id = pi.producto_id
    where pi.pedido_id = p_pedido_id
  loop
    declare
      v_linea_bruto numeric(12,2) := r.cantidad * r.precio_venta;
      v_linea_impuesto numeric(12,2) := round(
        v_linea_bruto - v_linea_bruto / (1 + r.impuesto_iva_pct / 100),
        2
      );
    begin
      insert into factura_items (
        factura_id, producto_id, cantidad, precio_unitario,
        impuesto_pct, impuesto_monto, monto_total
      ) values (
        v_factura.id, r.producto_id, r.cantidad, r.precio_venta,
        r.impuesto_iva_pct, v_linea_impuesto, v_linea_bruto
      );

      v_subtotal := v_subtotal + v_linea_bruto;
      v_total_impuesto := v_total_impuesto + v_linea_impuesto;

      perform descontar_inventario_por_venta(r.producto_id, r.cantidad, p_pedido_id, v_usuario_id);
    end;
  end loop;

  if v_tipo = 'salon' then
    v_total_servicio := round(v_subtotal * 0.10, 2);
  end if;

  update facturas
    set subtotal = v_subtotal,
        total_impuesto = v_total_impuesto,
        total_servicio = v_total_servicio,
        total_comprobante = v_subtotal + v_total_servicio,
        estado = 'cobrada'
    where id = v_factura.id
    returning * into v_factura;

  insert into pagos (factura_id, metodo, monto, recibido_por)
  values (v_factura.id, p_medio_pago, p_monto_recibido, v_usuario_id);

  update pedidos
    set estado = 'cerrado', cerrado_en = now()
    where id = p_pedido_id;

  if v_mesa_id is not null then
    update mesas set estado = 'libre' where id = v_mesa_id;
  end if;

  return v_factura;
end;
$$;
