import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "owner" | "reception";

/**
 * Resuelve el rol de staff de un usuario.
 *
 * STAFF_EMAILS (env var) sigue existiendo como llave maestra permanente
 * — no solo como bootstrap. Si el email está en esa lista, siempre es
 * 'owner', sin importar lo que diga profiles.role. Es la red de
 * seguridad para no quedarse afuera del propio panel por un error de
 * datos (ej: alguien se saca el rol de owner por accidente desde
 * /admin/staff). Fuera de esa lista, el rol sale de profiles.role,
 * que se asigna desde /admin/staff (ver staff_role_invites en la
 * migración).
 */
export async function getStaffRole(
  user: User | null
): Promise<StaffRole | null> {
  if (!user?.email) return null;

  const staffEmails = (process.env.STAFF_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (staffEmails.includes(user.email.toLowerCase())) {
    return "owner";
  }

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "owner" || profile?.role === "reception") {
    return profile.role;
  }

  return null;
}

export async function isStaff(user: User | null): Promise<boolean> {
  return (await getStaffRole(user)) !== null;
}

export async function isOwner(user: User | null): Promise<boolean> {
  return (await getStaffRole(user)) === "owner";
}
