import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/auth/staff";

// Editar datos de un socio (por ahora solo full_name). Solo Dueño.
// Existe porque todavía no hay pantalla de registro pública (`/signup`)
// que le pida el nombre al usuario — algunas cuentas actuales quedaron
// con full_name null. Esto es el parche desde el admin mientras tanto.
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

  const { full_name } = await req.json();
  if (typeof full_name !== "string" || !full_name.trim()) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ full_name: full_name.trim() })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
