-- ============================================================================
-- 0009: Fix search_path en funciones Auth (rol_usuario no visible desde auth)
-- ============================================================================

create or replace function public.auth_rol()
returns public.rol_usuario
language sql
security definer
stable
set search_path = public
as $$
  select rol from public.usuarios where id = auth.uid();
$$;

create or replace function public.manejar_nuevo_usuario_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', new.email),
    coalesce(
      (new.raw_user_meta_data->>'rol')::public.rol_usuario,
      'mesero'::public.rol_usuario
    )
  );
  return new;
end;
$$;
