-- ============================================================
-- KINETIC — Rachas (streaks) + job nocturno
-- Correr en el SQL editor DESPUÉS de:
--   schema.sql → admin_panel_migration.sql → redemption_code_migration.sql
-- ============================================================
-- Qué resuelve: hoy profiles.current_streak_weeks arranca en 0 y nada lo
-- actualiza, así que el bonus de racha del motor de puntos nunca se dispara.
-- Esto lo calcula de verdad y lo mantiene al día (incluido el corte por
-- ausencia, que solo un job nocturno puede detectar: si el socio deja de
-- venir, no hay ningún evento que "apague" la racha por sí solo).
--
-- Definición de "semana de racha": semana ISO (lunes a domingo) con al
-- menos 2 check-ins. Coincide con el badge 'racha_hierro'.
-- current_streak_weeks = cantidad de semanas consecutivas —terminando en la
-- semana en curso o la pasada— que cumplen ese mínimo y siguen vivas.

-- ------------------------------------------------------------
-- 1. Recalcular la racha de UN socio (fuente de verdad = tabla checkins)
--    Se llama en cada check-in y también desde el job nocturno.
--    Devuelve el nuevo valor y lo persiste en profiles.
-- ------------------------------------------------------------
create or replace function public.recalc_streak(p_user_id uuid)
returns int as $$
declare
  v_min_per_week constant int := 2;                          -- ← mínimo de check-ins por semana
  v_cur_week date := date_trunc('week', current_date)::date; -- lunes de esta semana
  v_streak int := 0;
  v_week date;
  v_cnt int;
begin
  -- La semana EN CURSO solo suma si ya alcanzó el mínimo. Si todavía no,
  -- no cuenta pero tampoco corta la racha (la semana no terminó).
  select count(*) into v_cnt
  from checkins
  where user_id = p_user_id
    and checkin_date >= v_cur_week
    and checkin_date <  v_cur_week + 7;
  if v_cnt >= v_min_per_week then
    v_streak := 1;
  end if;

  -- Hacia atrás por semanas YA COMPLETAS: cada una que cumple, suma;
  -- la primera que no cumple, corta.
  v_week := v_cur_week - 7;
  loop
    select count(*) into v_cnt
    from checkins
    where user_id = p_user_id
      and checkin_date >= v_week
      and checkin_date <  v_week + 7;
    exit when v_cnt < v_min_per_week;
    v_streak := v_streak + 1;
    v_week := v_week - 7;
  end loop;

  update profiles set current_streak_weeks = v_streak where id = p_user_id;
  return v_streak;
end;
$$ language plpgsql security definer set search_path = public;

-- ------------------------------------------------------------
-- 2. Recalcular TODOS (job nocturno). A escala piloto, el loop simple
--    alcanza y sobra; si algún día son miles de socios se optimiza.
-- ------------------------------------------------------------
create or replace function public.recalc_all_streaks()
returns void as $$
declare r record;
begin
  for r in select id from profiles loop
    perform public.recalc_streak(r.id);
  end loop;
end;
$$ language plpgsql security definer set search_path = public;

-- ------------------------------------------------------------
-- 3. Programar el job nocturno con pg_cron (corre DENTRO de Postgres,
--    en tu Oracle Cloud — sin depender de Vercel ni de la red).
--    03:10 hora del servidor. Ajustá el horario si querés.
-- ------------------------------------------------------------
-- pg_cron viene en la imagen de Supabase self-hosted. Si el CREATE EXTENSION
-- falla, verificá que 'pg_cron' esté en shared_preload_libraries del
-- postgresql.conf y reiniciá el contenedor de la DB.
create extension if not exists pg_cron;

-- Evita duplicar el schedule si corrés la migración más de una vez.
select cron.unschedule('recalc-streaks-nightly')
where exists (select 1 from cron.job where jobname = 'recalc-streaks-nightly');

select cron.schedule(
  'recalc-streaks-nightly',
  '10 3 * * *',
  $$ select public.recalc_all_streaks(); $$
);

-- ------------------------------------------------------------
-- (opcional) Backfill inmediato: deja las rachas al día ahora mismo,
-- sin esperar a la primera corrida nocturna.
-- ------------------------------------------------------------
select public.recalc_all_streaks();
