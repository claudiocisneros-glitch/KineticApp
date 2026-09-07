/**
 * Motor de puntos de Kinetic Gym — Piloto MVP
 *
 * Implementa la regla definida y acordada:
 * 1. Base fija: 100 KP por check-in
 * 2. Bonus de arranque (+50%): primeros 30 días como socio
 *    → ataca la ventana de mayor riesgo de abandono
 * 3. Bonus de constancia ESCALONADO por racha:
 *    +20% desde la 2da semana consecutiva, +40% desde la 6ta, +60% desde la 12va
 *    → cuanto más larga la racha, más rinde cada check-in. Romper la racha
 *      (la calcula recalc_streak en la DB) vuelve al escalón base.
 * 4. Bonus de antigüedad (escalón fijo, no continuo):
 *    +10% desde los 6 meses, +20% desde el año
 *    → reconocimiento de lealtad, sin ser el motor principal
 *
 * Los bonus son ACUMULATIVOS (se suman los porcentajes aplicables).
 *
 * Nota: "semana de racha" = semana ISO con >= 2 check-ins (ver
 * streaks_migration.sql). currentStreakWeeks llega ya calculado.
 */

const BASE_POINTS = 100;

export interface PointsBreakdown {
  base: number;
  onboardingBonus: number;
  streakBonus: number;
  tenureBonus: number;
  total: number;
}

export interface CheckinContext {
  memberSince: Date;
  currentStreakWeeks: number; // semanas consecutivas con actividad, ya calculado
  checkinDate?: Date; // default: ahora
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function monthsBetween(a: Date, b: Date): number {
  return (
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  );
}

/**
 * Bonus de racha escalonado. Cambiá estos 3 escalones si querés otra curva.
 * (Son porcentajes sobre la base de 100 KP.)
 */
function streakBonusPct(weeks: number): number {
  if (weeks >= 12) return 0.6;
  if (weeks >= 6) return 0.4;
  if (weeks >= 2) return 0.2;
  return 0;
}

export function calculatePoints(ctx: CheckinContext): PointsBreakdown {
  const now = ctx.checkinDate ?? new Date();
  const daysAsMember = daysBetween(ctx.memberSince, now);
  const monthsAsMember = monthsBetween(ctx.memberSince, now);

  // Bonus de arranque — primeros 30 días
  const onboardingApplies = daysAsMember <= 30;

  // Bonus de racha — escalonado por semanas consecutivas
  const streakPct = streakBonusPct(ctx.currentStreakWeeks);

  // Bonus de antigüedad — escalones fijos
  let tenurePct = 0;
  if (monthsAsMember >= 12) tenurePct = 0.2;
  else if (monthsAsMember >= 6) tenurePct = 0.1;

  const onboardingBonus = onboardingApplies ? Math.round(BASE_POINTS * 0.5) : 0;
  const streakBonus = streakPct > 0 ? Math.round(BASE_POINTS * streakPct) : 0;
  const tenureBonus = tenurePct > 0 ? Math.round(BASE_POINTS * tenurePct) : 0;

  const total = BASE_POINTS + onboardingBonus + streakBonus + tenureBonus;

  return {
    base: BASE_POINTS,
    onboardingBonus,
    streakBonus,
    tenureBonus,
    total,
  };
}

/**
 * Evalúa qué badges corresponde otorgar tras un check-in.
 * Se ejecuta después de registrar el check-in y actualizar el contador.
 * Devuelve los códigos de badge a otorgar (si no los tiene ya).
 */
export interface BadgeEvalContext {
  memberSince: Date;
  totalCheckins: number;
  checkinsInFirst30Days: number;
  currentStreakWeeks: number;
  daysSinceLastCheckinBeforeThis: number | null; // null si es el primer check-in
}

export function evaluateBadges(ctx: BadgeEvalContext): string[] {
  const earned: string[] = [];

  if (ctx.checkinsInFirst30Days >= 8) {
    earned.push("arranque_fuerte");
  }

  if (ctx.currentStreakWeeks >= 4) {
    earned.push("racha_hierro");
  }

  if (
    ctx.daysSinceLastCheckinBeforeThis !== null &&
    ctx.daysSinceLastCheckinBeforeThis >= 14
  ) {
    earned.push("volviste");
  }

  if (ctx.totalCheckins >= 50) {
    earned.push("socio_de_ley");
  }

  return earned;
}
