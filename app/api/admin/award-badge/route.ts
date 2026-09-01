import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaff } from "@/lib/auth/staff";

// Otorgar un badge manualmente. Dueño y Recepción — es tarea del día a
// día del piso del gimnasio, el dueño no siempre está presente.
// El catálogo de badges (crear/editar) sigue siendo solo Dueño, ver
// /api/admin/badges. ignoreDuplicates evita error si el socio ya lo
// tenía (unique constraint en user_badges).
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!(await isStaff(user))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { userId, badgeId } = await req.json();
  if (!userId || !badgeId) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("user_badges")
    .upsert(
      { user_id: userId, badge_id: badgeId },
      { onConflict: "user_id,badge_id", ignoreDuplicates: true }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
