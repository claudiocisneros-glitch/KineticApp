-- ============================================================
-- KINETIC — Guard: las recompensas con reward_trigger NO se canjean
-- con puntos (se ganan). Correr DESPUÉS de reto60_migration.sql.
-- ============================================================
-- Reemplaza redeem_reward agregando un solo chequeo: si la recompensa
-- tiene reward_trigger (p. ej. el premio del Reto 60), no se puede
-- comprar. Todo lo demás queda igual que la versión de
-- redemption_code_migration.sql.

create or replace function public.redeem_reward(p_user_id uuid, p_reward_id uuid)
returns table(redemption_id uuid, points_spent int, redemption_code text) as $$
declare
  v_cost int;
  v_max_redemptions int;
  v_trigger text;
  v_already_redeemed int;
  v_balance int;
  v_redemption_id uuid;
  v_code text;
  v_attempts int := 0;
begin
  perform 1 from profiles where id = p_user_id for update;

  select cost_points, max_redemptions_per_user, reward_trigger
    into v_cost, v_max_redemptions, v_trigger
  from rewards
  where id = p_reward_id and is_active = true;

  if v_cost is null then
    raise exception 'Recompensa no encontrada o inactiva';
  end if;

  -- NUEVO: los premios que se GANAN (trigger) no se compran con puntos.
  if v_trigger is not null then
    raise exception 'Esta recompensa no se canjea con puntos';
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
