-- ============================================================
-- KINETIC — Histórico de actividad (para el gráfico de IMPACTO)
-- Correr en Oracle después de member_risk_migration.sql.
-- ============================================================
-- Guarda una foto diaria de "socios activos" y "en riesgo". El gráfico de
-- seguimiento (semana / mes / 6 meses / custom) lee de acá. Empieza a
-- acumular desde hoy, así que la serie se va llenando con el paso de los días.

create table if not exists activity_snapshots (
  snapshot_date date primary key default current_date,
  active_count  int not null,
  risk_count    int not null,
  created_at    timestamptz not null default now()
);

create or replace function public.take_activity_snapshot()
returns void as $$
declare
  v_active_window constant int := 21;  -- mismo umbral que "socio activo"
  v_active int;
  v_risk int;
begin
  select count(distinct c.user_id) into v_active
  from checkins c
  join profiles p on p.id = c.user_id
  where p.role is null
    and c.checkin_date >= current_date - (v_active_window - 1);

  select count(*) into v_risk from member_risk;

  insert into activity_snapshots (snapshot_date, active_count, risk_count)
  values (current_date, v_active, v_risk)
  on conflict (snapshot_date) do update
    set active_count = excluded.active_count,
        risk_count   = excluded.risk_count,
        created_at   = now();
end;
$$ language plpgsql security definer set search_path = public;

-- Job nocturno 03:30 (después de rachas 03:10 y riesgo 03:20)
create extension if not exists pg_cron;

select cron.unschedule('activity-snapshot-nightly')
where exists (select 1 from cron.job where jobname = 'activity-snapshot-nightly');

select cron.schedule(
  'activity-snapshot-nightly',
  '30 3 * * *',
  $$ select public.take_activity_snapshot(); $$
);

-- Foto de hoy para arrancar la serie.
select public.take_activity_snapshot();
