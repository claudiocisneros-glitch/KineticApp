-- ============================================================
-- KINETIC — Estado de aprobación del socio (pending / active)
-- Correr en Oracle. Base del modelo de auto-registro + aprobación.
-- ============================================================
-- Nuevos socios que se auto-registran quedan 'pending' hasta que el staff
-- los aprueba. Los que crea el staff a mano quedan 'active' directo
-- (lo setea el route de alta). Los socios que YA existen quedan 'active'.

alter table profiles
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'active'));

-- Socios existentes → activos (no hay que aprobarlos).
update profiles set status = 'active' where status = 'pending';

-- Índice para la cola de aprobaciones (listar pendientes rápido).
create index if not exists profiles_status_idx on profiles (status);
