import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePoints, evaluateBadges } from "@/lib/points-engine";

export async function POST(req: Request) {
  const supabase = createClient(); // identifica quién es el usuario (RLS normal)
  const admin = createAdminClient(); // escribe/lee lo que el usuario no puede directo
  const { code } = await req.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 1. Validar que el QR sea el vigente (anti-abuso: rota periódicamente)
  //    Se usa el cliente admin porque el usuario no tiene (ni debe tener)
  //    permiso de leer esta tabla directo.
  const { data: qr, error: qrError } = await admin
    .from("gym_qr_codes")
    .select("*")
    .eq("code", code)
    .gte("valid_until", new Date().toISOString())
    .lte("valid_from", new Date().toISOString())
    .maybeSingle();

  if (qrError || !qr) {
    return NextResponse.json(
      { error: "Código QR inválido o vencido" },
      { status: 400 }
    );
  }

  // 2. Traer perfil y datos necesarios para calcular puntos y badges
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { count: totalCheckinsBefore } = await supabase
    .from("checkins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: checkinsFirst30Days } = await supabase
    .from("checkins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte(
      "created_at",
      new Date(
        new Date(profile.member_since).getTime() + 30 * 24 * 60 * 60 * 1000
      ).toISOString()
    );

  const daysSinceLast = profile.last_checkin_at
    ? Math.floor(
        (Date.now() - new Date(profile.last_checkin_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Nota: el cálculo de "semana consecutiva" real requiere lógica de calendario
  // más fina (ver comentario al final del archivo) — acá se usa el contador
  // ya persistido en profiles.current_streak_weeks como fuente de verdad.
  const breakdown = calculatePoints({
    memberSince: new Date(profile.member_since),
    currentStreakWeeks: profile.current_streak_weeks,
  });

  // 3. Registrar el check-in (admin: el usuario no tiene policy de INSERT,
  //    a propósito — solo el servidor puede crear check-ins válidos)
  const { data: checkin, error: checkinError } = await admin
    .from("checkins")
    .insert({
      user_id: user.id,
      qr_code_id: qr.id,
      points_awarded: breakdown.total,
      breakdown,
    })
    .select()
    .single();

  if (checkinError) {
    // Código 23505 = violación de constraint UNIQUE (ya hizo check-in hoy)
    if (checkinError.code === "23505") {
      return NextResponse.json(
        { error: "Ya registraste tu check-in de hoy. ¡Nos vemos mañana!" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: checkinError.message }, { status: 500 });
  }

  // 4. Sumar al ledger de puntos (admin: mismo motivo que arriba)
  await admin.from("points_ledger").insert({
    user_id: user.id,
    amount: breakdown.total,
    reason: "checkin",
    reference_id: checkin.id,
  });

  // 5. Actualizar el perfil (última asistencia) — admin: no hay policy de
  //    UPDATE para el usuario a propósito, evita que pueda "tocar" su
  //    propio historial de asistencia manualmente.
  await admin
    .from("profiles")
    .update({ last_checkin_at: new Date().toISOString() })
    .eq("id", user.id);

  // 6. Evaluar badges nuevos
  const newBadgeCodes = evaluateBadges({
    memberSince: new Date(profile.member_since),
    totalCheckins: (totalCheckinsBefore ?? 0) + 1,
    checkinsInFirst30Days: (checkinsFirst30Days ?? 0) + 1,
    currentStreakWeeks: profile.current_streak_weeks,
    daysSinceLastCheckinBeforeThis: daysSinceLast,
  });

  if (newBadgeCodes.length > 0) {
    const { data: badgeRows } = await supabase
      .from("badges")
      .select("id, code")
      .in("code", newBadgeCodes);

    if (badgeRows) {
      await admin.from("user_badges").upsert(
        badgeRows.map((b) => ({ user_id: user.id, badge_id: b.id })),
        { onConflict: "user_id,badge_id", ignoreDuplicates: true }
      );
    }
  }

  return NextResponse.json({ breakdown, newBadges: newBadgeCodes });
}

/**
 * PENDIENTE (marcado a propósito, no resuelto en este scaffold):
 * El cálculo de current_streak_weeks (si la racha sigue viva o se cortó)
 * requiere una función que corra por check-in o por cron diario, comparando
 * el check-in actual contra la semana calendario anterior. Se deja afuera
 * de este scaffold inicial para no sobre-construir antes de validar el
 * resto del loop — es la primera pieza a resolver en Claude Code.
 */
