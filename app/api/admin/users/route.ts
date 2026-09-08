import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaff } from "@/lib/auth/staff";

// Alta manual de socio. La hace el staff (dueño o recepción). Como el staff
// solo da de alta a quien ya pagó/se asoció, el alta ES la confirmación del
// pago. Crea el usuario en Auth (el trigger handle_new_user arma el profile
// con un referral_code por default) y, si se cargó un código, guarda quién
// lo trajo.

function tempPassword(): string {
  // Contraseña temporal legible para pasarle al socio.
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

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

  const { full_name, email, referral_code } = await req.json();

  if (!full_name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "Nombre y email son obligatorios." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Si vino código de referido, validarlo ANTES de crear al socio.
  let referrerId: string | null = null;
  if (referral_code?.trim()) {
    const code = referral_code.trim().toUpperCase();
    const { data: ref } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!ref) {
      return NextResponse.json(
        { error: "El código de referido no existe. Revisalo o dejalo vacío." },
        { status: 400 }
      );
    }
    referrerId = ref.id;
  }

  const password = tempPassword();

  const { data: created, error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim() },
  });

  if (error || !created?.user) {
    const msg = error?.message?.toLowerCase().includes("already")
      ? "Ese email ya está registrado."
      : error?.message ?? "No se pudo crear el socio.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const newId = created.user.id;

  if (referrerId) {
    await admin
      .from("profiles")
      .update({ referred_by: referrerId })
      .eq("id", newId);
  }

  // El referral_code lo puso el default de la columna al crear el profile.
  const { data: prof } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("id", newId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    fullName: full_name.trim(),
    email: email.trim().toLowerCase(),
    tempPassword: password,
    referralCode: prof?.referral_code ?? null,
  });
}
