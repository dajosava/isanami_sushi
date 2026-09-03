-- ============================================================================
-- 0013: Fix crear_comprobante_venta (safeupdate exige WHERE)
-- ============================================================================

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
  r record;
  v_usuario_id uuid := auth.uid();
  v_mesa_id uuid;
begin
  -- Incremento atomico del consecutivo (safeupdate exige WHERE)
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
      v_linea_subtotal numeric(12,2) := r.cantidad * r.precio_venta;
      v_linea_impuesto numeric(12,2) := round(v_linea_subtotal * r.impuesto_iva_pct / 100, 2);
    begin
      insert into factura_items (
        factura_id, producto_id, cantidad, precio_unitario,
        impuesto_pct, impuesto_monto, monto_total
      ) values (
        v_factura.id, r.producto_id, r.cantidad, r.precio_venta,
        r.impuesto_iva_pct, v_linea_impuesto, v_linea_subtotal + v_linea_impuesto
      );

      v_subtotal := v_subtotal + v_linea_subtotal;
      v_total_impuesto := v_total_impuesto + v_linea_impuesto;

      perform descontar_inventario_por_venta(r.producto_id, r.cantidad, p_pedido_id, v_usuario_id);
    end;
  end loop;

  update facturas
    set subtotal = v_subtotal,
        total_impuesto = v_total_impuesto,
        total_comprobante = v_subtotal + v_total_impuesto,
        estado = 'cobrada'
    where id = v_factura.id
    returning * into v_factura;

  insert into pagos (factura_id, metodo, monto, recibido_por)
  values (v_factura.id, p_medio_pago, p_monto_recibido, v_usuario_id);

  update pedidos
    set estado = 'cerrado', cerrado_en = now()
    where id = p_pedido_id
    returning mesa_id into v_mesa_id;

  if v_mesa_id is not null then
    update mesas set estado = 'libre' where id = v_mesa_id;
  end if;

  return v_factura;
end;
$$;
