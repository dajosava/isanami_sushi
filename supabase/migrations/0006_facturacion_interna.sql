-- ============================================================================
-- 0006: Facturacion (comprobante interno de cobro)
-- La facturacion electronica fiscal ante Hacienda la resuelve un sistema
-- externo del cliente; esta tabla NO tiene clave numerica ni XML de Hacienda.
-- ============================================================================

create table clientes (
  id uuid primary key default gen_random_uuid(),
  tipo_identificacion text,
  identificacion text,
  nombre text,
  email text,
  telefono text
);

alter table pedidos
  add constraint fk_pedidos_cliente foreign key (cliente_id) references clientes(id);

create type estado_comprobante as enum ('abierta', 'cobrada', 'anulada');
create type medio_pago as enum ('efectivo', 'tarjeta', 'sinpe', 'mixto');

create table facturas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id),
  cliente_id uuid references clientes(id),
  numero_comprobante text not null unique,
  fecha_emision timestamptz not null default now(),
  condicion_venta text default 'contado',
  medio_pago medio_pago not null,
  subtotal numeric(12,2) not null default 0,
  total_descuento numeric(12,2) not null default 0,
  total_impuesto numeric(12,2) not null default 0,
  total_comprobante numeric(12,2) not null default 0,
  estado estado_comprobante not null default 'abierta',
  exportado_a_facturacion_fiscal boolean not null default false,
  pdf_url text
);

create table factura_items (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references facturas(id) on delete cascade,
  producto_id uuid not null references productos(id),
  cantidad int not null check (cantidad > 0),
  precio_unitario numeric(12,2) not null,
  descuento numeric(12,2) not null default 0,
  impuesto_pct numeric(5,2) not null default 13,
  impuesto_monto numeric(12,2) not null default 0,
  monto_total numeric(12,2) not null default 0
);

create table pagos (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references facturas(id) on delete cascade,
  metodo medio_pago not null,
  monto numeric(12,2) not null check (monto > 0),
  referencia text,
  recibido_por uuid references usuarios(id),
  creado_en timestamptz not null default now()
);

create index idx_facturas_fecha on facturas(fecha_emision);
create index idx_facturas_estado on facturas(estado);
create index idx_pagos_factura on pagos(factura_id);

-- ---------------------------------------------------------------------------
-- Funcion RPC: crea el comprobante interno de cobro de forma atomica.
-- - Genera el numero_comprobante incrementando restaurante_config de forma
--   segura (evita duplicados si dos cajeros facturan al mismo tiempo).
-- - Copia los pedido_items a factura_items con el precio congelado.
-- - Descuenta inventario segun receta de cada producto.
-- - Registra el pago.
-- Invocada desde actions/facturacion.actions.ts via supabase.rpc(...)
-- ---------------------------------------------------------------------------
create or replace function crear_comprobante_venta(
  p_pedido_id uuid,
  p_cliente_id uuid,
  p_medio_pago medio_pago,
  p_monto_recibido numeric
)
returns facturas
language plpgsql
security definer
as $$
declare
  v_consecutivo bigint;
  v_numero_comprobante text;
  v_factura facturas;
  v_subtotal numeric(12,2) := 0;
  v_total_impuesto numeric(12,2) := 0;
  r record;
  v_usuario_id uuid := auth.uid();
begin
  -- Incremento atomico del consecutivo (lock de la fila de config)
  -- Nota: safeupdate de Supabase exige WHERE en todo UPDATE
  update restaurante_config
    set consecutivo_comprobante_actual = consecutivo_comprobante_actual + 1
    where id = (select id from restaurante_config order by creado_en asc limit 1)
    returning consecutivo_comprobante_actual into v_consecutivo;

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

      -- Descuenta inventario segun receta (misma transaccion que la venta)
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

  update pedidos set estado = 'cerrado', cerrado_en = now() where id = p_pedido_id;

  return v_factura;
end;
$$;
