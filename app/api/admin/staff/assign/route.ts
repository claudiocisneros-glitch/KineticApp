import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/auth/staff";

// Asigna un rol de staff por email. Solo Dueño.
// Si la persona ya tiene cuenta, se actualiza profiles.role directo.
// Si no, se guarda en staff_role_invites y el trigger handle_new_user
// se lo aplica automáticamente cuando se registre con ese email.
export async function POST(req: Request) {
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

  const { email, role } = await req.json();
  if (!email || (role !== "owner" && role !== "reception")) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const admin = createAdminClient();

  // Busca si ya existe una cuenta con ese email (paginado simple —
  // alcanza sobradamente para el tamaño de un gimnasio piloto).
  const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const existingUser = usersPage.users.find(
    (u) => u.email?.toLowerCase() === normalizedEmail
  );

  if (existingUser) {
    const { error } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", existingUser.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, mode: "assigned" });
  }

  const { error } = await admin
    .from("staff_role_invites")
    .upsert({ email: normalizedEmail, role });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "invited" });
}
