-- ============================================================
-- KINETIC — Motor de riesgo (member_risk)
-- Correr en Oracle DESPUÉS de streaks_migration.sql.
-- ============================================================
-- Calcula, por reglas simples (nada de ML), qué socios están en riesgo de
-- abandonar. Corre de noche (después de recalcular rachas) y deja la lista
-- lista para que el staff la use en IMPACTO como tarea de contacto.
--
-- Señales:
--   absent          → hace >= N días que no viene
--   streak_at_risk  → tiene racha, esta semana no llegó al mínimo y la
--                     semana está por terminar
--   frequency_drop  → su ritmo de check-ins cayó contra su propia base

-- ------------------------------------------------------------
-- 1. Tabla: solo socios EN riesgo (una fila por socio). Se reconstruye
--    cada corrida. RLS activado sin policies → nadie la lee salvo el
--    service role (que usa el admin del panel).
-- ------------------------------------------------------------
create table if not exists member_risk (
  user_id      uuid primary key references profiles(id) on delete cascade,
  signals      text[] not null,
  score        int not null,
  reason       text not null,       -- motivo principal, legible
  last_checkin date,
  computed_at  timestamptz not null default now()
);

alter table member_risk enable row level security;

-- ------------------------------------------------------------
-- 2. Recalcular la lista de riesgo (llamada por el job nocturno)
-- ------------------------------------------------------------
create or replace function public.recalc_member_risk()
returns void as $$
declare
  v_absent_days   constant int     := 10;  -- días sin venir -> ausente
  v_freq_window   constant int     := 14;  -- ventana para medir frecuencia
  v_decline_ratio constant numeric := 0.5; -- reciente < 50% de su base -> cae
  v_streak_min    constant int     := 2;   -- check-ins/semana para la racha
begin
  delete from member_risk;

  insert into member_risk (user_id, signals, score, reason, last_checkin, computed_at)
  select
    p.id,
    sig.signals,
    coalesce(array_length(sig.signals, 1), 0),
    case
      when 'absent'         = any(sig.signals) then 'Dejó de venir'
      when 'streak_at_risk' = any(sig.signals) then 'Racha por caerse'
      when 'frequency_drop' = any(sig.signals) then 'Bajó la frecuencia'
      else 'En riesgo'
    end,
    stats.last_checkin,
    now()
  from profiles p
  cross join lateral (
    select
      max(c.checkin_date) as last_checkin,
      count(*) filter (
        where c.checkin_date >= current_date - (v_freq_window - 1)
      ) as recent,
      count(*) filter (
        where c.checkin_date >= current_date - (2 * v_freq_window - 1)
          and c.checkin_date <  current_date - (v_freq_window - 1)
      ) as prior,
      count(*) filter (
        where c.checkin_date >= date_trunc('week', current_date)::date
      ) as this_week
    from checkins c
    where c.user_id = p.id
  ) stats
  cross join lateral (
    select array_remove(array[
      case
        when stats.last_checkin is not null
         and stats.last_checkin <= current_date - v_absent_days
        then 'absent'
      end,
      case
        when p.current_streak_weeks >= 1
         and stats.this_week < v_streak_min
         and (7 - extract(isodow from current_date)) <= 2
        then 'streak_at_risk'
      end,
      case
        when stats.prior > 0
         and stats.recent < stats.prior * v_decline_ratio
        then 'frequency_drop'
      end
    ], null) as signals
  ) sig
  where p.role is null
    and coalesce(array_length(sig.signals, 1), 0) >= 1;
end;
$$ language plpgsql security definer set search_path = public;

-- ------------------------------------------------------------
-- 3. Job nocturno — 03:20 (después de las rachas de las 03:10)
-- ------------------------------------------------------------
create extension if not exists pg_cron;

select cron.unschedule('recalc-member-risk-nightly')
where exists (select 1 from cron.job where jobname = 'recalc-member-risk-nightly');

select cron.schedule(
  'recalc-member-risk-nightly',
  '20 3 * * *',
  $$ select public.recalc_member_risk(); $$
);

-- Backfill inmediato para ver la lista ya mismo en IMPACTO.
select public.recalc_member_risk();
