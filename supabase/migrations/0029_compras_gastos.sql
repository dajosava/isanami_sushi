-- ---------------------------------------------------------------------------
-- 0029: Compras y gastos — subtotal, IVA, categoría y concepto
-- ---------------------------------------------------------------------------

alter table compras
  add column if not exists subtotal numeric(12,2) not null default 0,
  add column if not exists total_impuesto numeric(12,2) not null default 0,
  add column if not exists impuesto_iva_pct numeric(5,2) not null default 13,
  add column if not exists categoria_gasto text not null default 'mercaderia',
  add column if not exists concepto text;

-- Histórico: el total guardado era bruto sin desglose de IVA
update compras
set
  subtotal = total,
  total_impuesto = 0,
  impuesto_iva_pct = 0
where total_impuesto = 0
  and subtotal = 0
  and total > 0;

alter table compras
  drop constraint if exists compras_categoria_gasto_check;

alter table compras
  add constraint compras_categoria_gasto_check
  check (
    categoria_gasto in (
      'mercaderia',
      'limpieza',
      'publicidad',
      'alquiler',
      'servicios_publicos',
      'mantenimiento',
      'otros'
    )
  );

alter table compras
  drop constraint if exists compras_impuesto_iva_pct_check;

alter table compras
  add constraint compras_impuesto_iva_pct_check
  check (impuesto_iva_pct in (0, 1, 13));

alter table compras
  drop constraint if exists compras_montos_nonneg_check;

alter table compras
  add constraint compras_montos_nonneg_check
  check (
    subtotal >= 0
    and total_impuesto >= 0
    and total >= 0
  );

comment on column compras.subtotal is 'Monto antes de IVA';
comment on column compras.total_impuesto is 'Monto de IVA calculado';
comment on column compras.impuesto_iva_pct is 'Tasa IVA: 0 (exento), 1 o 13';
comment on column compras.categoria_gasto is 'Clasificación del gasto (mercadería, limpieza, etc.)';
comment on column compras.concepto is 'Descripción libre (útil en gastos sin líneas de insumo)';
