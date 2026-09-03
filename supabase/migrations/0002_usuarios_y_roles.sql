-- ============================================================================
-- 0002: Usuarios y roles de negocio
-- ============================================================================

create type rol_usuario as enum ('admin', 'gerente', 'cajero', 'mesero', 'cocina', 'contador');

-- Extiende auth.users con datos de negocio. El id es el mismo que auth.users.id
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol rol_usuario not null default 'mesero',
  pin_caja text, -- pin corto opcional para acciones rapidas en caja
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Helper: rol del usuario autenticado actual (se usa en las policies de RLS)
create or replace function auth_rol()
returns rol_usuario
language sql
security definer
stable
set search_path = public
as $$
  select rol from public.usuarios where id = auth.uid();
$$;

-- Trigger: cuando se crea un usuario en auth.users, crear su fila en `usuarios`
-- con rol por defecto 'mesero' (se debe ajustar manualmente el rol real despues,
-- o adaptar este trigger para leer el rol desde raw_user_meta_data al invitarlo).
create or replace function manejar_nuevo_usuario_auth()
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function manejar_nuevo_usuario_auth();
