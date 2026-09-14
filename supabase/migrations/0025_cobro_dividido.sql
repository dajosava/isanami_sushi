-- ============================================================================
-- 0025: Cobro dividido — un comprobante con varios pagos
-- Fix: no usar alias/variable "p" (choca productos.id vs record de pago)
-- ============================================================================

create or replace function public.crear_comprobante_venta_pagos(
  p_pedido_id uuid,
  p_cliente_id uuid,
  p_pagos jsonb
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
  v_total numeric(12,2) := 0;
  v_suma_pagos numeric(12,2) := 0;
  v_tipo tipo_pedido;
  v_mesa_id uuid;
  v_usuario_id uuid := auth.uid();
  v_medio_factura medio_pago;
  v_metodos text[] := '{}';
  v_item record;
  v_pago record;
begin
  if p_pagos is null or jsonb_typeof(p_pagos) <> 'array' or jsonb_array_length(p_pagos) < 1 then
    raise exception 'Debes indicar al menos un pago';
  end if;

  select tipo, mesa_id into v_tipo, v_mesa_id
  from pedidos
  where id = p_pedido_id
  for update;

  if v_tipo is null then
    raise exception 'Pedido no encontrado';
  end if;

  if exists (
    select 1 from pedidos where id = p_pedido_id and estado in ('cerrado', 'anulado')
  ) then
    raise exception 'El pedido ya esta cerrado o anulado';
  end if;

  -- Validar y sumar pagos
  for v_pago in
    select
      (elem->>'metodo')::medio_pago as metodo,
      (elem->>'monto')::numeric(12,2) as monto,
      nullif(trim(elem->>'etiqueta'), '') as etiqueta
    from jsonb_array_elements(p_pagos) elem
  loop
    if v_pago.metodo is null then
      raise exception 'Medio de pago invalido en un pago';
    end if;
    if v_pago.monto is null or v_pago.monto <= 0 then
      raise exception 'Cada pago debe tener un monto mayor a cero';
    end if;
    v_suma_pagos := v_suma_pagos + v_pago.monto;
    v_metodos := array_append(v_metodos, v_pago.metodo::text);
  end loop;

  update restaurante_config
    set consecutivo_comprobante_actual = consecutivo_comprobante_actual + 1
    where id = (select id from restaurante_config order by creado_en asc limit 1)
    returning consecutivo_comprobante_actual into v_consecutivo;

  if v_consecutivo is null then
    raise exception 'No hay fila en restaurante_config';
  end if;

  v_numero_comprobante := 'ISN-' || lpad(v_consecutivo::text, 6, '0');

  if (select count(distinct m) from unnest(v_metodos) as m) = 1 then
    v_medio_factura := v_metodos[1]::medio_pago;
  else
    v_medio_factura := 'mixto';
  end if;

  insert into facturas (pedido_id, cliente_id, numero_comprobante, medio_pago)
  values (p_pedido_id, p_cliente_id, v_numero_comprobante, v_medio_factura)
  returning * into v_factura;

  for v_item in
    select
      pi.id,
      pi.producto_id,
      pi.cantidad,
      prod.precio_venta,
      prod.impuesto_iva_pct
    from pedido_items pi
    join productos prod on prod.id = pi.producto_id
    where pi.pedido_id = p_pedido_id
  loop
    declare
      v_linea_bruto numeric(12,2) := v_item.cantidad * v_item.precio_venta;
      v_linea_impuesto numeric(12,2) := round(
        v_linea_bruto - v_linea_bruto / (1 + v_item.impuesto_iva_pct / 100),
        2
      );
    begin
      insert into factura_items (
        factura_id, producto_id, cantidad, precio_unitario,
        impuesto_pct, impuesto_monto, monto_total
      ) values (
        v_factura.id, v_item.producto_id, v_item.cantidad, v_item.precio_venta,
        v_item.impuesto_iva_pct, v_linea_impuesto, v_linea_bruto
      );

      v_subtotal := v_subtotal + v_linea_bruto;
      v_total_impuesto := v_total_impuesto + v_linea_impuesto;

      perform descontar_inventario_por_venta(
        v_item.producto_id,
        v_item.cantidad,
        p_pedido_id,
        v_usuario_id
      );
    end;
  end loop;

  if v_tipo = 'salon' then
    v_total_servicio := round(v_subtotal * 0.10, 2);
  end if;

  v_total := v_subtotal + v_total_servicio;

  if v_suma_pagos + 0.009 < v_total then
    raise exception 'La suma de pagos (%) es menor al total (%)', v_suma_pagos, v_total;
  end if;

  update facturas
    set subtotal = v_subtotal,
        total_impuesto = v_total_impuesto,
        total_servicio = v_total_servicio,
        total_comprobante = v_total,
        estado = 'cobrada'
    where id = v_factura.id
    returning * into v_factura;

  for v_pago in
    select
      (elem->>'metodo')::medio_pago as metodo,
      (elem->>'monto')::numeric(12,2) as monto,
      nullif(trim(elem->>'etiqueta'), '') as etiqueta
    from jsonb_array_elements(p_pagos) elem
  loop
    insert into pagos (factura_id, metodo, monto, referencia, recibido_por)
    values (v_factura.id, v_pago.metodo, v_pago.monto, v_pago.etiqueta, v_usuario_id);
  end loop;

  update pedidos
    set estado = 'cerrado', cerrado_en = now()
    where id = p_pedido_id;

  if v_mesa_id is not null then
    update mesas set estado = 'libre' where id = v_mesa_id;
  end if;

  return v_factura;
end;
$$;

grant execute on function public.crear_comprobante_venta_pagos(uuid, uuid, jsonb) to authenticated;
