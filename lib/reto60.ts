/**
 * Reto 60 — configuración y estado.
 *
 * Regla de economía: 1 check-in = 100 KP = "1 visita". Todo se expresa
 * en múltiplos de eso, así ningún número queda arbitrario.
 *
 * El reto arranca en el PRIMER check-in del socio (no en el alta) y mide
 * FRECUENCIA: 24 check-ins dentro de una ventana de 60 días. No importa
 * si son consecutivos.
 *
 * Estas constantes son el único lugar donde se tocan los valores. El
 * premio físico final NO se define acá: lo elige el dueño marcando una
 * recompensa con reward_trigger = 'reto_60' (ver reto60_migration.sql).
 */
export const RETO60 = {
  target: 24,
  windowDays: 60,
  milestones: [
    { at: 6, kp: 200, message: "¡Una semana de constancia! 6 de 24." }, // 2 visitas
    { at: 12, kp: 300, message: "¡Mitad de camino! 12 de 24." }, //         3 visitas
    { at: 18, kp: 500, message: "Recta final: 18 de 24. Ya casi." }, //     5 visitas
    { at: 24, kp: 1000, message: "¡Completaste el Reto 60!" }, //          10 visitas + premio
  ],
} as const;

export interface Reto60Status {
  active: boolean; // arrancó (tiene al menos 1 check-in) y la ventana no venció
  completed: boolean; // llegó a la meta
  progress: number; // check-ins dentro de la ventana
  target: number;
  daysLeft: number;
  pct: number; // 0..100
  nextMilestone: number | null; // próximo hito en cantidad de check-ins
  toNext: number | null; // cuántos faltan para el próximo hito
}

/**
 * Estado del reto para pintarlo en el front. Se calcula a partir de la
 * fecha del primer check-in y de cuántos check-ins hay dentro de la
 * ventana — todo derivable, sin tabla de tracking.
 */
export function buildReto60Status(
  firstCheckinDate: Date | null,
  checkinsInWindow: number,
  now: Date = new Date()
): Reto60Status {
  if (!firstCheckinDate) {
    return {
      active: false,
      completed: false,
      progress: 0,
      target: RETO60.target,
      daysLeft: RETO60.windowDays,
      pct: 0,
      nextMilestone: RETO60.milestones[0].at,
      toNext: RETO60.milestones[0].at,
    };
  }

  const endMs =
    firstCheckinDate.getTime() + RETO60.windowDays * 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(
    0,
    Math.ceil((endMs - now.getTime()) / (24 * 60 * 60 * 1000))
  );
  const completed = checkinsInWindow >= RETO60.target;
  const active = !completed && daysLeft > 0;

  const next = RETO60.milestones.find((m) => m.at > checkinsInWindow) ?? null;

  return {
    active,
    completed,
    progress: Math.min(checkinsInWindow, RETO60.target),
    target: RETO60.target,
    daysLeft,
    pct: Math.min(100, Math.round((checkinsInWindow / RETO60.target) * 100)),
    nextMilestone: next ? next.at : null,
    toNext: next ? next.at - checkinsInWindow : null,
  };
}
