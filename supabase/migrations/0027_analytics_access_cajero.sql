-- ============================================================================
-- 0027: Permitir a cajero consultar RPCs de analitica
-- (resumen operativo en /ventas; la UI de /analitica sigue restringida en app)
-- ============================================================================

create or replace function assert_analytics_access()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth_rol() not in ('admin', 'gerente', 'contador', 'cajero') then
    raise exception 'No autorizado para analitica financiera';
  end if;
end;
$$;
