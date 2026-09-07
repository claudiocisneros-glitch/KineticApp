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

  // CAMBIO: recalcular la racha ANTES de puntuar, contra la tabla checkins.
  // Corrige el valor guardado (p. ej. si se cortó por ausencia y nadie la
  // apagó todavía). Este valor es la racha con la que el socio "llega" hoy;
  // el check-in de hoy suma para la próxima. Fuente de verdad, no el número
  // que estaba en profiles.
  const { data: streakBefore } = await admin.rpc("recalc_streak", {
    p_user_id: user.id,
  });
  const currentStreakWeeks = streakBefore ?? profile.current_streak_weeks ?? 0;

  const breakdown = calculatePoints({
    memberSince: new Date(profile.member_since),
    currentStreakWeeks,
  });

  // 3. Registrar el check-in (admin: el usuario no tiene policy de INSERT)
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
    // 23505 = UNIQUE (ya hizo check-in hoy)
    if (checkinError.code === "23505") {
      return NextResponse.json(
        { error: "Ya registraste tu check-in de hoy. ¡Nos vemos mañana!" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: checkinError.message }, { status: 500 });
  }

  // 4. Sumar al ledger de puntos
  await admin.from("points_ledger").insert({
    user_id: user.id,
    amount: breakdown.total,
    reason: "checkin",
    reference_id: checkin.id,
  });

  // 5. Actualizar última asistencia
  await admin
    .from("profiles")
    .update({ last_checkin_at: new Date().toISOString() })
    .eq("id", user.id);

  // CAMBIO: recalcular la racha DE NUEVO, ahora que el check-in de hoy ya
  // está insertado. Deja current_streak_weeks al día para la UI, para el
  // próximo check-in y para la evaluación de badges de abajo.
  const { data: streakAfter } = await admin.rpc("recalc_streak", {
    p_user_id: user.id,
  });
  const streakForBadges = streakAfter ?? currentStreakWeeks;

  // 6. Evaluar badges nuevos
  const newBadgeCodes = evaluateBadges({
    memberSince: new Date(profile.member_since),
    totalCheckins: (totalCheckinsBefore ?? 0) + 1,
    checkinsInFirst30Days: (checkinsFirst30Days ?? 0) + 1,
    currentStreakWeeks: streakForBadges,
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
