import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/auth/staff";

// Editar (o activar/desactivar) una recompensa existente. Solo Dueño.
// Acepta actualización parcial — RewardsManager la usa tanto para el
// form de edición completo como para el toggle rápido de is_active.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!(await isOwner(user))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (typeof body.name === "string") update.name = body.name;
  if (typeof body.description === "string" || body.description === null)
    update.description = body.description;
  if (typeof body.cost_points === "number") update.cost_points = body.cost_points;
  if (
    typeof body.max_redemptions_per_user === "number" ||
    body.max_redemptions_per_user === null
  )
    update.max_redemptions_per_user = body.max_redemptions_per_user;
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("rewards")
    .update(update)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
