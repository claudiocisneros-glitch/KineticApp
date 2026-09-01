import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/auth/staff";

// Editar un badge existente. Solo Dueño. No permite tocar `code` — es el
// identificador que usa la lógica de evaluación de badges en el backend
// (evaluateBadges), cambiarlo rompería esa referencia.
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
  if (typeof body.icon_url === "string" || body.icon_url === null)
    update.icon_url = body.icon_url;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("badges").update(update).eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
