import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/auth/staff";

// Crear un badge nuevo (catálogo). Solo Dueño.
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

  const { code, name, description, icon_url } = await req.json();

  if (!code || !name) {
    return NextResponse.json({ error: "Código y nombre son obligatorios" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("badges").insert({
    code: String(code).trim().toLowerCase().replace(/\s+/g, "_"),
    name,
    description: description ?? null,
    icon_url: icon_url ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe un badge con ese código" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
