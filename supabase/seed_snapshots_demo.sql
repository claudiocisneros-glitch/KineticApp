-- ============================================================
-- KINETIC — Datos de EJEMPLO para el gráfico de seguimiento
-- Correr en Oracle. Llena 90 días de activity_snapshots con una tendencia
-- realista (activos subiendo, en riesgo bajando) para que el gráfico de
-- IMPACTO muestre algo en el piloto.
--
-- OJO: son datos ficticios, solo para la demo. Al implementar en un cliente
-- real, borralos (ver el DELETE comentado al final) o reseteá la base.
-- ============================================================

insert into activity_snapshots (snapshot_date, active_count, risk_count)
select
  gs::date as snapshot_date,
  -- activos: arranca ~90 y sube hasta ~142, con algo de ruido
  greatest(0,
    round(90 + (gs::date - (current_date - 89)) * 0.58 + (random() * 6 - 3))
  )::int as active_count,
  -- en riesgo: arranca ~40 y baja hasta ~16, piso en 6, con ruido
  greatest(6,
    round(40 - (gs::date - (current_date - 89)) * 0.27 + (random() * 4 - 2))
  )::int as risk_count
from generate_series(current_date - 89, current_date, interval '1 day') gs
on conflict (snapshot_date) do update
  set active_count = excluded.active_count,
      risk_count   = excluded.risk_count,
      created_at   = now();

-- Verificación rápida (opcional):
--   select count(*), min(snapshot_date), max(snapshot_date) from activity_snapshots;

-- ------------------------------------------------------------
-- Para BORRAR los datos de ejemplo cuando quieras (el job nocturno
-- vuelve a llenar solo con datos reales desde ese día):
--   delete from activity_snapshots;
-- ------------------------------------------------------------
