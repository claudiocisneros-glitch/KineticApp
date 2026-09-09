import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePoints, evaluateBadges } from "@/lib/points-engine";
import { RETO60 } from "@/lib/reto60";

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

  // 1. Validar que el QR sea el vigente
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

  // 2. Traer perfil y datos necesarios
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.status && profile.status !== "active") {
    return NextResponse.json(
      { error: "Tu cuenta está pendiente de aprobación del staff." },
      { status: 403 }
    );
  }

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

  // Racha ANTES de puntuar (corrige el valor guardado). El check-in de hoy
  // suma para la próxima; el KP de hoy usa la racha con la que llega.
  const { data: streakBefore } = await admin.rpc("recalc_streak", {
    p_user_id: user.id,
  });
  const currentStreakWeeks = streakBefore ?? profile.current_streak_weeks ?? 0;

  const breakdown = calculatePoints({
    memberSince: new Date(profile.member_since),
    currentStreakWeeks,
  });

  // 3. Registrar el check-in
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
    if (checkinError.code === "23505") {
      return NextResponse.json(
        { error: "Ya registraste tu check-in de hoy. ¡Nos vemos mañana!" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: checkinError.message }, { status: 500 });
  }

  // 4. Sumar KP del check-in al ledger
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

  // Racha DESPUÉS de insertar (hoy ya cuenta): deja el contador al día.
  const { data: streakAfter } = await admin.rpc("recalc_streak", {
    p_user_id: user.id,
  });
  const streakForBadges = streakAfter ?? currentStreakWeeks;

  // 6. Evaluar badges nuevos (los 4 de siempre)
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

  // 7. Reto 60 — progreso, hitos y premio final
  //    Ventana = 60 días desde el PRIMER check-in. Mide frecuencia
  //    (24 check-ins dentro de la ventana), no días consecutivos.
  let reto60: {
    progress: number;
    target: number;
    daysLeft: number;
    justCrossed: { at: number; kp: number; message: string } | null;
    completed: boolean;
  } | null = null;

  const { data: firstRow } = await admin
    .from("checkins")
    .select("checkin_date")
    .eq("user_id", user.id)
    .order("checkin_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstRow) {
    const firstMs = new Date(firstRow.checkin_date + "T00:00").getTime();
    const windowEndStr = new Date(firstMs + RETO60.windowDays * 86400000)
      .toISOString()
      .slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    const withinWindow = todayStr < windowEndStr;

    const { count: inWindow } = await admin
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("checkin_date", firstRow.checkin_date)
      .lt("checkin_date", windowEndStr);

    const progressAfter = inWindow ?? 0;
    const progressBefore = withinWindow ? progressAfter - 1 : progressAfter;

    let justCrossed: { at: number; kp: number; message: string } | null = null;
    let justCompleted = false;

    if (withinWindow) {
      for (const m of RETO60.milestones) {
        if (progressBefore < m.at && progressAfter >= m.at) {
          // KP del hito al ledger
          await admin.from("points_ledger").insert({
            user_id: user.id,
            amount: m.kp,
            reason:
              m.at === RETO60.target ? "reto60_complete" : "reto60_milestone",
            reference_id: checkin.id,
          });
          justCrossed = { at: m.at, kp: m.kp, message: m.message };
          if (m.at === RETO60.target) justCompleted = true;
        }
      }
    }

    if (justCompleted) {
      // Badge Reto 60 (a lo grande en el front vía newBadges)
      const { data: retoBadge } = await supabase
        .from("badges")
        .select("id")
        .eq("code", "reto_60")
        .maybeSingle();
      if (retoBadge) {
        await admin.from("user_badges").upsert(
          [{ user_id: user.id, badge_id: retoBadge.id }],
          { onConflict: "user_id,badge_id", ignoreDuplicates: true }
        );
        if (!newBadgeCodes.includes("reto_60")) newBadgeCodes.push("reto_60");
      }

      // Premio físico que el dueño haya marcado (si hay). Gratis.
      const { data: prize } = await admin
        .from("rewards")
        .select("id")
        .eq("reward_trigger", "reto_60")
        .eq("is_active", true)
        .maybeSingle();
      if (prize) {
        await admin.rpc("grant_reward_free", {
          p_user_id: user.id,
          p_reward_id: prize.id,
        });
      }
    }

    // Solo devolvemos progreso del reto si sigue ACTIVO (dentro de la
    // ventana y sin completar) o si justo se cruzó un hito. Si venció o ya
    // estaba completo, no mandamos nada y el check-in no muestra esa línea.
    const isActive = withinWindow && progressAfter < RETO60.target;
    reto60 =
      isActive || justCrossed
        ? {
            progress: Math.min(progressAfter, RETO60.target),
            target: RETO60.target,
            daysLeft: Math.max(
              0,
              Math.ceil(
                (firstMs + RETO60.windowDays * 86400000 - Date.now()) / 86400000
              )
            ),
            justCrossed,
            completed: progressAfter >= RETO60.target,
          }
        : null;
  }

  // 8. Referido: si es el PRIMER check-in y vino recomendado, se premia a
  //    ambos (el pago está implícito en que el staff lo dio de alta).
  let referral: { welcomeKp: number } | null = null;
  if ((totalCheckinsBefore ?? 0) === 0) {
    const { data: refRes } = await admin.rpc("reward_referral", {
      p_referred_id: user.id,
    });
    if (refRes?.rewarded) referral = { welcomeKp: refRes.welcome_kp };
  }

  return NextResponse.json({
    breakdown,
    newBadges: newBadgeCodes,
    reto60,
    referral,
  });
}
