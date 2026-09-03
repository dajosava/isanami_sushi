-- ============================================================================
-- 0012: Nota/motivo en movimientos de inventario (mermas)
-- ============================================================================

alter table public.movimientos_inventario
  add column if not exists nota text;
