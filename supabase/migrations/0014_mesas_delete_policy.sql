-- Permitir eliminar mesas a admin y gerente (faltaba policy de DELETE)
create policy "mesas_eliminar_admin_gerente" on public.mesas
  for delete using (auth_rol() in ('admin', 'gerente'));
