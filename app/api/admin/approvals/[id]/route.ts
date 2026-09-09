import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaff } from "@/lib/auth/staff";

// Aprobar (POST) o rechazar (DELETE) una solicitud de alta. Lo hace el staff.
// Aprobar = status 'active'. Rechazar = borra la cuenta de Auth (cascade
// elimina el profile).

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!(await isStaff(user)))
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status: "active" })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!(await isStaff(user)))
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
