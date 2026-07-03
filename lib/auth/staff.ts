import type { User } from "@supabase/supabase-js";

/**
 * Único lugar donde vive la lógica de "es staff o no".
 * Centralizado a propósito: si esto se copia y pega en cada ruta,
 * alguien eventualmente va a olvidarse de agregarlo en una ruta nueva
 * y queda un endpoint admin desprotegido sin que nadie lo note.
 */
export function isStaff(user: User | null): boolean {
  if (!user?.email) return false;

  const staffEmails = (process.env.STAFF_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return staffEmails.includes(user.email.toLowerCase());
}
