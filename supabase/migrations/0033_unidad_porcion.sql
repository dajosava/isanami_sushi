-- ============================================================================
-- 0033: Unidad de medida "porción" (insumos, recetas y compras)
-- ============================================================================

insert into unidades_medida (nombre, abreviatura)
select v.nombre, v.abreviatura
from (values
  ('porción', 'porc')
) as v(nombre, abreviatura)
where not exists (
  select 1 from unidades_medida u where u.abreviatura = v.abreviatura
);
