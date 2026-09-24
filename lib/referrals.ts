import type { SupabaseClient } from "@supabase/supabase-js";

// Fuente única de verdad para todo lo de referidos: cuándo se puede cargar
// un código y qué pasa cuando se carga. La usan tanto el socio (desde el
// check-in o el modal de recordatorio) como el staff (desde el alta
// manual) — mismo código, misma validación, misma carrera limpia.

export const REFERRAL_WINDOW_DAYS = 7;

export type ReferralWindowStatus = {
  // false = el socio todavía no hizo su primer check-in. El plazo de 7 días
  // se cuenta desde ESE día, no desde el alta — así que si todavía no
  // check-ineó nunca, el reloj ni arrancó y se puede cargar sin apuro
  // (por eso withinWindow es true en ese caso: no hay ninguna razón para
  // bloquear al staff en el alta, que siempre pasa antes del primer check-in).
  hasFirstCheckin: boolean;
  withinWindow: boolean;
  daysLeft: number;
};

export async function getReferralWindowStatus(
  admin: SupabaseClient,
  userId: string
): Promise<ReferralWindowStatus> {
  const { data: firstRow } = await admin
    .from("checkins")
    .select("checkin_date")
    .eq("user_id", userId)
    .order("checkin_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!firstRow) {
    return { hasFirstCheckin: false, withinWindow: true, daysLeft: REFERRAL_WINDOW_DAYS };
  }

  const firstMs = new Date(firstRow.checkin_date + "T00:00").getTime();
  const deadlineMs = firstMs + REFERRAL_WINDOW_DAYS * 86400000;
  const withinWindow = Date.now() <= deadlineMs;
  const daysLeft = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 86400000));

  return { hasFirstCheckin: true, withinWindow, daysLeft };
}

export type ApplyReferralResult =
  | { ok: true; welcomeKp: number }
  | { ok: false; error: string };

// Vincula el código al socio y dispara el premio al toque (no espera a
// ningún check-in futuro: si ya estamos acá es porque corresponde pagar).
// Quien llega primero gana: el `.is("referred_by", null)` en el UPDATE hace
// que, si el staff y el socio intentan cargarlo casi al mismo tiempo, el
// segundo update no afecte ninguna fila — no hace falta lockear nada a mano.
export async function applyReferralCode(
  admin: SupabaseClient,
  userId: string,
  rawCode: string
): Promise<ApplyReferralResult> {
  if (!rawCode?.trim()) {
    return { ok: false, error: "Falta el código" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return { ok: false, error: "Socio no encontrado" };
  }

  if (profile.referred_by) {
    return { ok: false, error: "Ya tiene un código de referido vinculado." };
  }

  const status = await getReferralWindowStatus(admin, userId);
  if (!status.withinWindow) {
    return {
      ok: false,
      error: "Se venció el plazo de 7 días desde el primer check-in.",
    };
  }

  const code = rawCode.trim().toUpperCase();
  const { data: referrer } = await admin
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();

  if (!referrer || referrer.id === userId) {
    return { ok: false, error: "Ese código de referido no existe." };
  }

  const { data: updated, error: linkError } = await admin
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", userId)
    .is("referred_by", null)
    .select("id");

  if (linkError) {
    return { ok: false, error: linkError.message };
  }

  if (!updated || updated.length === 0) {
    // Perdió la carrera contra otra carga casi simultánea (staff/socio).
    return { ok: false, error: "Ya tiene un código de referido vinculado." };
  }

  const { data: refRes } = await admin.rpc("reward_referral", {
    p_referred_id: userId,
  });

  return { ok: true, welcomeKp: refRes?.rewarded ? refRes.welcome_kp : 0 };
}
