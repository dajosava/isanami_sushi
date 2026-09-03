-- ============================================================================
-- 0008: Row Level Security — la seguridad real vive aqui, no solo en el frontend
-- ============================================================================

alter table usuarios enable row level security;
alter table restaurante_config enable row level security;
alter table categorias_menu enable row level security;
alter table productos enable row level security;
alter table mesas enable row level security;
alter table insumos enable row level security;
alter table unidades_medida enable row level security;
alter table proveedores enable row level security;
alter table recetas enable row level security;
alter table movimientos_inventario enable row level security;
alter table compras enable row level security;
alter table compras_items enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;
alter table comandas enable row level security;
alter table clientes enable row level security;
alter table facturas enable row level security;
alter table factura_items enable row level security;
alter table pagos enable row level security;
alter table turnos_caja enable row level security;
alter table cierres_diarios enable row level security;

-- ---------------------------------------------------------------------------
-- usuarios: cada quien ve su propia fila; admin ve y edita todo
-- ---------------------------------------------------------------------------
create policy "usuarios_ver_propio_o_admin" on usuarios
  for select using (id = auth.uid() or auth_rol() = 'admin');

create policy "usuarios_admin_gestiona" on usuarios
  for all using (auth_rol() = 'admin') with check (auth_rol() = 'admin');

-- ---------------------------------------------------------------------------
-- Catalogo (menu, mesas, config): lectura para todo el personal autenticado,
-- escritura solo admin/gerente
-- ---------------------------------------------------------------------------
create policy "catalogo_lectura_autenticados" on categorias_menu
  for select using (auth.uid() is not null);
create policy "catalogo_escritura_admin_gerente" on categorias_menu
  for all using (auth_rol() in ('admin','gerente')) with check (auth_rol() in ('admin','gerente'));

create policy "productos_lectura_autenticados" on productos
  for select using (auth.uid() is not null);
create policy "productos_escritura_admin_gerente" on productos
  for all using (auth_rol() in ('admin','gerente')) with check (auth_rol() in ('admin','gerente'));

create policy "mesas_lectura_autenticados" on mesas
  for select using (auth.uid() is not null);
create policy "mesas_escritura_admin_gerente_mesero" on mesas
  for update using (auth_rol() in ('admin','gerente','mesero','cajero'));
create policy "mesas_insertar_admin_gerente" on mesas
  for insert with check (auth_rol() in ('admin','gerente'));

create policy "config_lectura_autenticados" on restaurante_config
  for select using (auth.uid() is not null);
create policy "config_escritura_admin" on restaurante_config
  for update using (auth_rol() = 'admin');

-- ---------------------------------------------------------------------------
-- Inventario: solo admin/gerente (mesero y cocina no ven costos ni stock)
-- ---------------------------------------------------------------------------
create policy "unidades_lectura_admin_gerente" on unidades_medida
  for select using (auth_rol() in ('admin','gerente'));

create policy "insumos_admin_gerente" on insumos
  for all using (auth_rol() in ('admin','gerente')) with check (auth_rol() in ('admin','gerente'));

create policy "proveedores_admin_gerente" on proveedores
  for all using (auth_rol() in ('admin','gerente')) with check (auth_rol() in ('admin','gerente'));

create policy "recetas_admin_gerente" on recetas
  for all using (auth_rol() in ('admin','gerente')) with check (auth_rol() in ('admin','gerente'));

create policy "movimientos_admin_gerente" on movimientos_inventario
  for select using (auth_rol() in ('admin','gerente'));
-- Los inserts a movimientos_inventario los hacen las funciones security definer
-- (triggers/RPC), no el usuario final directamente.

create policy "compras_admin_gerente" on compras
  for all using (auth_rol() in ('admin','gerente')) with check (auth_rol() in ('admin','gerente'));
create policy "compras_items_admin_gerente" on compras_items
  for all using (auth_rol() in ('admin','gerente')) with check (auth_rol() in ('admin','gerente'));

-- ---------------------------------------------------------------------------
-- Pedidos y comandas: mesero/cajero/gerente/admin gestionan pedidos;
-- cocina solo ve/actualiza el estado de preparacion, no montos.
-- ---------------------------------------------------------------------------
create policy "pedidos_ver_operativos" on pedidos
  for select using (auth_rol() in ('admin','gerente','cajero','mesero','cocina'));

create policy "pedidos_crear_mesero_cajero" on pedidos
  for insert with check (auth_rol() in ('admin','gerente','mesero','cajero'));

create policy "pedidos_actualizar_mesero_cajero" on pedidos
  for update using (auth_rol() in ('admin','gerente','mesero','cajero'));

create policy "pedido_items_ver_operativos" on pedido_items
  for select using (auth_rol() in ('admin','gerente','cajero','mesero','cocina'));

create policy "pedido_items_crear_mesero_cajero" on pedido_items
  for insert with check (auth_rol() in ('admin','gerente','mesero','cajero'));

create policy "pedido_items_actualizar_operativos" on pedido_items
  for update using (auth_rol() in ('admin','gerente','mesero','cajero','cocina'));

create policy "comandas_ver_cocina_y_gerencia" on comandas
  for select using (auth_rol() in ('admin','gerente','cocina','mesero'));

create policy "comandas_actualizar_cocina" on comandas
  for update using (auth_rol() in ('admin','gerente','cocina'));
-- Los inserts de comandas los hace el trigger `generar_comandas_al_enviar`
-- (security definer), no el cliente directamente.

-- ---------------------------------------------------------------------------
-- Facturacion: cajero/gerente/admin ven y crean; contador solo lee
-- ---------------------------------------------------------------------------
create policy "clientes_operativos" on clientes
  for all using (auth_rol() in ('admin','gerente','cajero'))
  with check (auth_rol() in ('admin','gerente','cajero'));

create policy "facturas_ver" on facturas
  for select using (auth_rol() in ('admin','gerente','cajero','contador'));

create policy "facturas_anular" on facturas
  for update using (auth_rol() in ('admin','gerente','cajero'));
-- Los inserts de facturas los hace la funcion `crear_comprobante_venta`
-- (security definer, invocada via RPC), no un insert directo del cliente.

create policy "factura_items_ver" on factura_items
  for select using (auth_rol() in ('admin','gerente','cajero','contador'));

create policy "pagos_ver" on pagos
  for select using (auth_rol() in ('admin','gerente','cajero','contador'));

-- ---------------------------------------------------------------------------
-- Contabilidad: cajero gestiona su propio turno; gerente/admin/contador ven todo
-- ---------------------------------------------------------------------------
create policy "turnos_ver_propio_o_gerencia" on turnos_caja
  for select using (
    cajero_id = auth.uid() or auth_rol() in ('admin','gerente','contador')
  );

create policy "turnos_crear_cajero" on turnos_caja
  for insert with check (auth_rol() in ('admin','gerente','cajero'));

create policy "turnos_actualizar_propio_o_gerencia" on turnos_caja
  for update using (
    cajero_id = auth.uid() or auth_rol() in ('admin','gerente')
  );

create policy "cierres_diarios_ver" on cierres_diarios
  for select using (auth_rol() in ('admin','gerente','contador'));

create policy "cierres_diarios_generar" on cierres_diarios
  for insert with check (auth_rol() in ('admin','gerente'));
