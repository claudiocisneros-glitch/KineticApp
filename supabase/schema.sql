-- ============================================================
-- KINETIC GYM — Esquema MVP (Piloto, 1 gimnasio / 1 sede)
-- Implementa las reglas definidas: puntos con bonus de
-- arranque/racha/antigüedad, 4 badges, recompensas, QR rotativo.
-- ============================================================

-- Perfiles de usuario (extiende auth.users de Supabase)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  member_since date not null default current_date,
  current_streak_weeks int not null default 0,
  last_checkin_at timestamptz,
  created_at timestamptz not null default now()
);

-- QR rotativo del gimnasio (anti-abuso simple: el código cambia periódicamente)
create table gym_qr_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  valid_from timestamptz not null default now(),
  valid_until timestamptz not null,
  created_at timestamptz not null default now()
);

-- Registro de asistencias (check-ins)
-- checkin_date + constraint UNIQUE: evita que el mismo usuario sume puntos
-- más de una vez por día, sin importar cuántas veces escanee el QR.
-- Es una restricción a nivel de base de datos a propósito — así ni un bug
-- en el código de la API puede saltearla.
create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  qr_code_id uuid not null references gym_qr_codes(id),
  points_awarded int not null,
  breakdown jsonb not null, -- guarda el detalle: base, bonus arranque, racha, antigüedad
  checkin_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

-- Ledger de puntos (fuente de verdad del balance — nunca se resta directo, se audita)
create table points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount int not null, -- positivo (ganado) o negativo (canjeado)
  reason text not null, -- 'checkin', 'redemption', 'adjustment'
  reference_id uuid, -- checkin_id o redemption_id según corresponda
  created_at timestamptz not null default now()
);

-- Catálogo de badges (los 4 definidos — reglas evaluadas en backend, no acá)
create table badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- 'arranque_fuerte' | 'racha_hierro' | 'volviste' | 'socio_de_ley'
  name text not null,
  description text not null,
  icon_url text
);

create table user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  badge_id uuid not null references badges(id),
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- Catálogo de recompensas del piloto (todas provistas por el gimnasio, sin sponsors todavía)
create table rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cost_points int not null,
  is_active boolean not null default true,
  -- null = sin límite (se puede canjear las veces que alcancen los puntos).
  -- Un número = tope de veces que UN MISMO usuario puede canjearla en total.
  -- Existe para casos como "Reconocimiento en el gym": no es algo que se
  -- "compre" repetidamente, es un logro que pasa una vez.
  max_redemptions_per_user int,
  created_at timestamptz not null default now()
);

-- Canjes
create table redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  reward_id uuid not null references rewards(id),
  points_spent int not null,
  status text not null default 'pending', -- 'pending' | 'fulfilled'
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);

-- ============================================================
-- Vista de balance de puntos (evita recalcular en cada consulta)
-- ============================================================
create view user_points_balance as
select
  user_id,
  sum(amount) as balance
from points_ledger
group by user_id;

-- ============================================================
-- Seed inicial: los 4 badges definidos
-- ============================================================
insert into badges (code, name, description) values
  ('arranque_fuerte', 'Arranque Fuerte', '8+ check-ins en los primeros 30 días como socio'),
  ('racha_hierro', 'Racha de Hierro', '4 semanas consecutivas con al menos 2 check-ins/semana'),
  ('volviste', 'Volviste', 'Check-in después de 14+ días de inactividad'),
  ('socio_de_ley', 'Socio de Ley', '50 check-ins totales acumulados');

-- ============================================================
-- Función atómica de canje — evita condición de carrera
-- (dos clics rápidos no pueden dejar el balance en negativo,
-- porque el lock de fila serializa los canjes del mismo usuario)
-- ============================================================
create or replace function public.redeem_reward(p_user_id uuid, p_reward_id uuid)
returns table(redemption_id uuid, points_spent int) as $$
declare
  v_cost int;
  v_max_redemptions int;
  v_already_redeemed int;
  v_balance int;
  v_redemption_id uuid;
begin
  -- Lockea la fila del usuario: si llegan dos canjes casi simultáneos,
  -- el segundo espera a que el primero termine antes de leer el balance.
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

  insert into redemptions (user_id, reward_id, points_spent, status)
  values (p_user_id, p_reward_id, v_cost, 'pending')
  returning id into v_redemption_id;

  insert into points_ledger (user_id, amount, reason, reference_id)
  values (p_user_id, -v_cost, 'redemption', v_redemption_id);

  return query select v_redemption_id, v_cost;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================
-- Trigger: crear el perfil automáticamente al registrarse
-- (sin esto, un usuario nuevo real se rompe al loguearse porque
-- no existe su fila en profiles)
-- ============================================================
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, member_since)
  values (new.id, new.raw_user_meta_data->>'full_name', current_date);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row Level Security — cada usuario ve solo lo suyo
-- ============================================================
alter table profiles enable row level security;
alter table checkins enable row level security;
alter table points_ledger enable row level security;
alter table user_badges enable row level security;
alter table redemptions enable row level security;

create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can view their own checkins" on checkins
  for select using (auth.uid() = user_id);

create policy "Users can view their own ledger" on points_ledger
  for select using (auth.uid() = user_id);

create policy "Users can view their own badges" on user_badges
  for select using (auth.uid() = user_id);

create policy "Users can view their own redemptions" on redemptions
  for select using (auth.uid() = user_id);

-- rewards y badges son de lectura pública (catálogo)
alter table rewards enable row level security;
create policy "Anyone can view active rewards" on rewards
  for select using (is_active = true);

alter table badges enable row level security;
create policy "Anyone can view badges" on badges
  for select using (true);

-- gym_qr_codes: RLS activado SIN políticas públicas a propósito.
-- Nadie con la anon/authenticated key puede leerla directo (ni con
-- sesión de usuario). Solo el service role (que bypassea RLS) la
-- consulta, desde las API routes del servidor. Esto es justamente
-- lo que protege que el código QR rotativo no se pueda "levantar"
-- directo desde la API pública de Supabase.
alter table gym_qr_codes enable row level security;

-- Nota: profiles, checkins, points_ledger, user_badges y redemptions
-- solo tienen políticas de SELECT (arriba) a propósito. Los INSERT/UPDATE
-- de esas tablas los hacen exclusivamente las API routes con el cliente
-- admin (service role) — el usuario nunca escribe esas tablas directo,
-- ni con su propia sesión. Ver lib/supabase/admin.ts.
