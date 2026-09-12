-- Planilla / asistencia: registros ligados a cuentas de usuarios del sistema.

create table if not exists planilla_registros (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  fecha date not null,
  hora_entrada time,
  hora_salida time,
  notas text,
  registrado_por uuid references usuarios(id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint planilla_usuario_fecha_unique unique (usuario_id, fecha),
  constraint planilla_horas_ok check (
    hora_salida is null
    or hora_entrada is null
    or hora_salida >= hora_entrada
  )
);

comment on table planilla_registros is
  'Asistencia / planilla: un registro por colaborador y día, ligado a usuarios del sistema.';

create index if not exists idx_planilla_fecha on planilla_registros (fecha desc);
create index if not exists idx_planilla_usuario_fecha on planilla_registros (usuario_id, fecha desc);

create or replace function set_planilla_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists trg_planilla_actualizado_en on planilla_registros;
create trigger trg_planilla_actualizado_en
  before update on planilla_registros
  for each row execute function set_planilla_actualizado_en();

alter table planilla_registros enable row level security;

-- Ver propio o gerencia/contabilidad
create policy "planilla_select"
  on planilla_registros for select
  using (
    usuario_id = auth.uid()
    or auth_rol() in ('admin', 'gerente', 'contador')
  );

-- Crear propio o gerencia
create policy "planilla_insert"
  on planilla_registros for insert
  with check (
    usuario_id = auth.uid()
    or auth_rol() in ('admin', 'gerente')
  );

-- Actualizar propio o gerencia
create policy "planilla_update"
  on planilla_registros for update
  using (
    usuario_id = auth.uid()
    or auth_rol() in ('admin', 'gerente')
  )
  with check (
    usuario_id = auth.uid()
    or auth_rol() in ('admin', 'gerente')
  );

-- Borrar solo gerencia
create policy "planilla_delete"
  on planilla_registros for delete
  using (auth_rol() in ('admin', 'gerente'));

-- Gerencia/contabilidad puede ver nombres de colaboradores (planilla)
create policy "usuarios_select_gerencia_contador"
  on usuarios for select
  using (auth_rol() in ('gerente', 'contador'));
