-- Nombre del cliente en pedidos para llevar / delivery (etiqueta operativa, no facturación).

alter table pedidos
  add column if not exists nombre_cliente text;

comment on column pedidos.nombre_cliente is
  'Nombre de quien pide (para llevar / delivery). Se muestra en cocina en lugar del número de mesa.';

create index if not exists idx_pedidos_nombre_cliente
  on pedidos (nombre_cliente)
  where nombre_cliente is not null;
