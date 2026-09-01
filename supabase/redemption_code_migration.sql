-- ============================================================
-- Código de comprobante para canjes
-- ============================================================
-- Hasta ahora, cuando un socio canjeaba una recompensa (pase de
-- invitado, cupón de descuento, etc.) no le quedaba ningún
-- comprobante: solo un check verde en pantalla por 2.5 segundos.
-- No tenía forma de probar el canje en recepción, ni el staff una
-- forma rápida de encontrar ESE canje puntual en la lista.
--
-- Esta migración agrega un código corto (8 caracteres) a cada canje,
-- generado automáticamente por redeem_reward. El socio lo ve en la
-- app (pantalla "Mis canjes") y el staff lo busca en el panel de
-- Canjes para marcarlo como entregado.
--
-- Correr esto en el SQL Editor de Supabase DESPUÉS de
-- admin_panel_migration.sql.
-- ============================================================

alter table redemptions add column if not exists code text;

-- Backfill para canjes que ya existan sin código.
update redemptions
set code = upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8))
where code is null;

alter table redemptions alter column code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'redemptions_code_key'
  ) then
    alter table redemptions add constraint redemptions_code_key unique (code);
  end if;
end $$;

-- Reemplaza redeem_reward para que genere y devuelva el código.
-- Reintenta la generación si por azar choca con uno existente (8
-- caracteres alfanuméricos alcanzan de sobra para un gimnasio piloto,
-- pero el loop no cuesta nada y evita que un canje falle por eso).
--
-- Postgres no permite cambiar el tipo de retorno de una función con
-- CREATE OR REPLACE (la firma vieja devolvía 2 columnas, la nueva
-- devuelve 3) — hay que borrarla primero.
drop function if exists public.redeem_reward(uuid, uuid);

create or replace function public.redeem_reward(p_user_id uuid, p_reward_id uuid)
returns table(redemption_id uuid, points_spent int, redemption_code text) as $$
declare
  v_cost int;
  v_max_redemptions int;
  v_already_redeemed int;
  v_balance int;
  v_redemption_id uuid;
  v_code text;
  v_attempts int := 0;
begin
  perform 1 from profiles where id = p_user_id for update;

  select cost_points, max_redemptions_per_user into v_cost, v_max_redemptions
  from rewards
  where id = p_reward_id and is_active = true;

  if v_cost is null then
    raise exception 'Recompensa no encontrada o inactiva';
  end if;

  if v_max_redemptions is not null then
    select count(*) into v_already_redeemed
    from redemptions
    where user_id = p_user_id and reward_id = p_reward_id;

    if v_already_redeemed >= v_max_redemptions then
      raise exception 'Ya alcanzaste el límite de canjes para esta recompensa';
    end if;
  end if;

  select coalesce(sum(amount), 0) into v_balance
  from points_ledger
  where user_id = p_user_id;

  if v_balance < v_cost then
    raise exception 'Puntos insuficientes';
  end if;

  loop
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    begin
      insert into redemptions (user_id, reward_id, points_spent, status, code)
      values (p_user_id, p_reward_id, v_cost, 'pending', v_code)
      returning id into v_redemption_id;
      exit;
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 5 then
        raise exception 'No se pudo generar un código de canje único';
      end if;
    end;
  end loop;

  insert into points_ledger (user_id, amount, reason, reference_id)
  values (p_user_id, -v_cost, 'redemption', v_redemption_id);

  return query select v_redemption_id, v_cost, v_code;
end;
$$ language plpgsql security definer set search_path = public;
