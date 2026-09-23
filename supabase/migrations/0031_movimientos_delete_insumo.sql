-- ============================================================================
-- 0031: Permitir borrar movimientos al eliminar un insumo (admin/gerente)
-- ============================================================================

drop policy if exists "movimientos_delete_admin_gerente" on movimientos_inventario;

create policy "movimientos_delete_admin_gerente" on movimientos_inventario
  for delete
  using (auth_rol() in ('admin', 'gerente'));
