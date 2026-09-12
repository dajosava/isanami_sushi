-- Tarifa horaria por colaborador (para cálculo de pago en planilla).

alter table usuarios
  add column if not exists tarifa_hora numeric(12, 2);

comment on column usuarios.tarifa_hora is
  'Colones por hora para cálculo de pago en planilla. Null = sin tarifa definida.';
