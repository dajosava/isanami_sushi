-- ============================================================================
-- 0028: Unidad de medida en líneas de compra + unidades paquete/caja
-- ============================================================================

insert into unidades_medida (nombre, abreviatura)
select v.nombre, v.abreviatura
from (values
  ('paquete', 'paq'),
  ('caja', 'caja'),
  ('libra', 'lb')
) as v(nombre, abreviatura)
where not exists (
  select 1 from unidades_medida u where u.abreviatura = v.abreviatura
);

alter table compras_items
  add column if not exists unidad_medida_id uuid references unidades_medida(id);

-- Backfill desde el insumo
update compras_items ci
set unidad_medida_id = i.unidad_medida_id
from insumos i
where ci.insumo_id = i.id
  and ci.unidad_medida_id is null;

-- Filas huérfanas (no debería haber): unidad "unidad"
update compras_items
set unidad_medida_id = (
  select id from unidades_medida where abreviatura = 'u' order by id limit 1
)
where unidad_medida_id is null;

alter table compras_items
  alter column unidad_medida_id set not null;
