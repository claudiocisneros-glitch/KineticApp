-- ============================================================
-- Migración: panel de administración ampliado
-- Corré esto una sola vez en el SQL editor de Supabase, después de
-- schema.sql (y de badges_icons.sql si todavía no lo corriste).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Roles de staff
-- 'owner'     → acceso total al panel admin
-- 'reception' → QR del día, marcar canjes como entregados, ver socios
-- null        → socio regular, sin acceso al panel
-- ------------------------------------------------------------
alter table profiles add column if not exists role text
  check (role in ('owner', 'reception'));

-- ------------------------------------------------------------
-- 2. Invitaciones de rol por email
-- Permite que el dueño le asigne un rol a alguien ANTES de que esa
-- persona se registre en la app (ej: contratás a alguien de recepción,
-- le asignás el rol, y cuando esa persona crea su cuenta con ese email
-- el trigger de abajo le pone el rol automáticamente).
-- ------------------------------------------------------------
create table if not exists staff_role_invites (
  email text primary key,
  role text not null check (role in ('owner', 'reception')),
  created_at timestamptz not null default now()
);

alter table staff_role_invites enable row level security;
-- Sin políticas públicas a propósito — solo el service role (cliente
-- admin, desde las API routes de /admin/staff) la lee y escribe.

-- ------------------------------------------------------------
-- 3. Trigger de alta de usuario: ahora también resuelve invitaciones
-- de rol pendientes para el email que se está registrando.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role text;
begin
  select role into v_role
  from public.staff_role_invites
  where email = lower(new.email);

  insert into public.profiles (id, full_name, member_since, role)
  values (new.id, new.raw_user_meta_data->>'full_name', current_date, v_role);

  if v_role is not null then
    delete from public.staff_role_invites where email = lower(new.email);
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ------------------------------------------------------------
-- 4. Ajuste manual de puntos — función atómica, mismo criterio que
-- redeem_reward: lockea la fila del socio para evitar condiciones de
-- carrera si dos ajustes/canjes llegan casi al mismo tiempo.
-- ------------------------------------------------------------
create or replace function public.adjust_points(
  p_user_id uuid,
  p_amount int,
  p_note text
)
returns void as $$
begin
  perform 1 from profiles where id = p_user_id for update;

  insert into points_ledger (user_id, amount, reason, reference_id)
  values (p_user_id, p_amount, 'adjustment', null);

  -- El motivo del ajuste (ej: "bonus cumpleaños") queda en breakdown de
  -- un check-in NO corresponde acá — se guarda aparte, en su propia tabla,
  -- para no forzar el shape de checkins con datos que no son check-ins.
  insert into points_adjustments (user_id, amount, note)
  values (p_user_id, p_amount, p_note);
end;
$$ language plpgsql security definer set search_path = public;

create table if not exists points_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount int not null,
  note text not null,
  created_at timestamptz not null default now()
);

alter table points_adjustments enable row level security;
create policy "Users can view their own adjustments" on points_adjustments
  for select using (auth.uid() = user_id);
-- INSERT solo vía la función adjust_points (security definer) llamada
-- desde la API route de staff — mismo patrón que el resto de la app.

-- ------------------------------------------------------------
-- 5. Otorgar badge manualmente — evita duplicados por la unique
-- constraint que ya existe en user_badges (user_id, badge_id).
-- ------------------------------------------------------------
-- No hace falta una función nueva: el INSERT con ON CONFLICT DO NOTHING
-- alcanza y ya lo hace el cliente admin desde la API route.
