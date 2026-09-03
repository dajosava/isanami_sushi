-- ============================================================================
-- Datos iniciales de prueba (seguro de re-ejecutar)
-- ============================================================================

-- Tu usuario admin (ajusta el email si es otro)
update public.usuarios
set rol = 'admin',
    nombre = coalesce(nullif(nombre, ''), 'Admin Isanami'),
    activo = true
where id = (
  select id from auth.users where email = 'support@isanami.com' limit 1
);

-- Menú oficial: ver seed_menu_oficial.sql para el catálogo completo.
\ir seed_menu_oficial.sql

insert into mesas (numero, zona, capacidad)
select v.numero, v.zona, v.capacidad
from (values
  (1, 'Salon principal', 4),
  (2, 'Salon principal', 4),
  (3, 'Terraza', 6),
  (4, 'Terraza', 2),
  (5, 'Barra sushi', 2)
) as v(numero, zona, capacidad)
where not exists (
  select 1 from mesas m where m.numero = v.numero
);

insert into proveedores (nombre, telefono)
select v.nombre, v.telefono
from (values
  ('Mariscos del Pacifico S.A.', '2656-0000'),
  ('Distribuidora Asiatica CR', '2200-1111')
) as v(nombre, telefono)
where not exists (
  select 1 from proveedores pr where pr.nombre = v.nombre
);
