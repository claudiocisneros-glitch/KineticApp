-- ============================================================
-- KINETIC — Reto 60
-- Correr DESPUÉS de: schema.sql, admin_panel_migration.sql,
-- redemption_code_migration.sql, streaks_migration.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. reward_trigger: cómo se OBTIENE una recompensa.
--    null      → canje normal con puntos (como todas hoy)
--    'reto_60' → premio del Reto 60: no se compra, se GANA al completarlo
--    (Queda listo para sumar otros disparadores en el futuro.)
-- ------------------------------------------------------------
alter table rewards add column if not exists reward_trigger text
  check (reward_trigger in ('reto_60'));

-- Una sola recompensa puede ser el premio del Reto 60 a la vez.
-- (El índice único sobre el valor lo garantiza a nivel base de datos.)
create unique index if not exists rewards_one_reto60
  on rewards (reward_trigger) where reward_trigger is not null;

-- ------------------------------------------------------------
-- 2. Badge del Reto 60
-- ------------------------------------------------------------
insert into badges (code, name, description, icon_url)
values ('reto_60', 'Reto 60',
        'Completaste 24 check-ins en tus primeros 60 días',
        '/badges/reto-60.svg')
on conflict (code) do nothing;

-- ------------------------------------------------------------
-- 3. Otorgar una recompensa GRATIS (sin descontar puntos).
--    Reusa la tabla redemptions: genera el código, aparece en "Mis
--    canjes" y el staff la entrega igual que un canje normal.
--    Idempotente: si el socio ya la tiene, no la duplica.
-- ------------------------------------------------------------
create or replace function public.grant_reward_free(
  p_user_id uuid,
  p_reward_id uuid
)
returns table(redemption_id uuid, redemption_code text) as $$
declare
  v_active boolean;
  v_code text;
  v_id uuid;
  v_attempts int := 0;
begin
  select is_active into v_active from rewards where id = p_reward_id;
  if v_active is null then
    raise exception 'Recompensa no encontrada';
  end if;

  -- Ya la tiene → no duplicar (devuelve conjunto vacío)
  if exists (
    select 1 from redemptions
    where user_id = p_user_id and reward_id = p_reward_id
  ) then
    return;
  end if;

  loop
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    begin
      insert into redemptions (user_id, reward_id, points_spent, status, code)
      values (p_user_id, p_reward_id, 0, 'pending', v_code)
      returning id into v_id;
      exit;
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 5 then
        raise exception 'No se pudo generar un código de canje único';
      end if;
    end;
  end loop;

  return query select v_id, v_code;
end;
$$ language plpgsql security definer set search_path = public;

-- ------------------------------------------------------------
-- (opcional) Marcar a mano el premio del Reto 60 mientras no esté el
-- desplegable en el admin. Reemplazá el nombre por una recompensa real:
--
--   update rewards set reward_trigger = 'reto_60'
--   where name = 'NOMBRE DE LA RECOMPENSA';
-- ------------------------------------------------------------
