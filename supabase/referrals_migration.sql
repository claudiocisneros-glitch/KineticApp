-- ============================================================
-- KINETIC — Referidos
-- Correr en Oracle después de las migraciones anteriores.
-- ============================================================
-- Flujo: cada socio tiene un código; al dar de alta a un amigo el staff
-- carga ese código (opcional); en el PRIMER check-in del amigo se otorga
-- KP a ambos y, si corresponde, el badge al que invita.

-- ------------------------------------------------------------
-- 1. Columnas en profiles
-- ------------------------------------------------------------
alter table profiles add column if not exists referral_code text;
alter table profiles add column if not exists referred_by uuid references profiles(id);
alter table profiles add column if not exists referral_rewarded_at timestamptz;

-- ------------------------------------------------------------
-- 2. Generador de código único (6 caracteres)
-- ------------------------------------------------------------
create or replace function public.generate_referral_code()
returns text as $$
declare
  v_code text;
  v_tries int := 0;
begin
  loop
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
    exit when not exists (select 1 from profiles where referral_code = v_code);
    v_tries := v_tries + 1;
    if v_tries > 10 then
      v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
      exit;
    end if;
  end loop;
  return v_code;
end;
$$ language plpgsql;

-- Backfill de socios existentes, luego default para los nuevos
-- (handle_new_user no setea referral_code → toma el default).
update profiles set referral_code = public.generate_referral_code()
where referral_code is null;

alter table profiles alter column referral_code set default public.generate_referral_code();

create unique index if not exists profiles_referral_code_key
  on profiles (referral_code);

-- ------------------------------------------------------------
-- 3. Badge del que invita (si ya lo creaste a mano con OTRO code,
--    renombralo a 'rey_referidos' o borralo — la lógica busca ese code).
-- ------------------------------------------------------------
insert into badges (code, name, description, icon_url)
values ('rey_referidos', 'Rey de los Referidos',
        'Trajo 5 amigos que se sumaron al gym',
        '/badges/rey-referidos.svg')
on conflict (code) do nothing;

-- ------------------------------------------------------------
-- 4. Otorgar el premio de referido (se llama en el primer check-in).
--    Idempotente: usa referral_rewarded_at para no pagar dos veces.
-- ------------------------------------------------------------
create or replace function public.reward_referral(p_referred_id uuid)
returns jsonb as $$
declare
  v_kp              constant int := 300;  -- KP a cada parte
  v_badge_threshold constant int := 5;    -- referidos para el badge
  v_monthly_cap     constant int := 5;    -- referidos premiados por mes
  v_referrer uuid;
  v_rewarded timestamptz;
  v_month_start date := date_trunc('month', current_date)::date;
  v_ref_this_month int;
  v_ref_total int;
  v_badge_id uuid;
  v_referrer_paid boolean := false;
begin
  select referred_by, referral_rewarded_at
    into v_referrer, v_rewarded
  from profiles where id = p_referred_id;

  -- No vino por referido, o ya se premió antes → nada
  if v_referrer is null or v_rewarded is not null then
    return jsonb_build_object('rewarded', false);
  end if;

  -- Bienvenida al nuevo socio (vino recomendado)
  insert into points_ledger (user_id, amount, reason)
  values (p_referred_id, v_kp, 'referral_welcome');

  -- Tope mensual del que invita
  select count(*) into v_ref_this_month
  from profiles
  where referred_by = v_referrer
    and referral_rewarded_at >= v_month_start;

  if v_ref_this_month < v_monthly_cap then
    insert into points_ledger (user_id, amount, reason)
    values (v_referrer, v_kp, 'referral');
    v_referrer_paid := true;
  end if;

  -- Marcar como premiado (no reintentar)
  update profiles set referral_rewarded_at = now() where id = p_referred_id;

  -- Badge al que invita, por cantidad total de referidos premiados
  if v_referrer_paid then
    select count(*) into v_ref_total
    from profiles
    where referred_by = v_referrer
      and referral_rewarded_at is not null;

    if v_ref_total >= v_badge_threshold then
      select id into v_badge_id from badges where code = 'rey_referidos';
      if v_badge_id is not null then
        insert into user_badges (user_id, badge_id)
        values (v_referrer, v_badge_id)
        on conflict (user_id, badge_id) do nothing;
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'rewarded', true,
    'welcome_kp', v_kp,
    'referrer_paid', v_referrer_paid
  );
end;
$$ language plpgsql security definer set search_path = public;
