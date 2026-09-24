import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaff } from "@/lib/auth/staff";
import { applyReferralCode } from "@/lib/referrals";

// Alta manual de socio. La hace el staff (dueño o recepción). Como el staff
// solo da de alta a quien ya pagó/se asoció, el alta ES la confirmación del
// pago. Crea el usuario en Auth (el trigger handle_new_user arma el profile
// con un referral_code por default) y lo activa directo.
//
// El código de quien lo recomendó es opcional acá: si el socio se lo dio al
// staff en el mostrador, se carga en el momento (vía lib/referrals.ts, el
// mismo código que usa el socio desde la app). Si no lo dio, no pasa nada —
// el socio todavía puede cargarlo él mismo hasta 7 días después de su
// primer check-in. El que lo carga primero gana la carrera.

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

  // Si vino código, se valida ANTES de crear al socio — así un código
  // mal tipeado no te deja con una cuenta ya creada para corregir después.
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

  // El alta manual ES la confirmación del pago (ver comentario arriba):
  // este socio no debe pasar por la cola de /admin/solicitudes. Antes esto
  // no se seteaba y el profile quedaba en 'pending' (default de la columna),
  // así que el socio recién creado —con contraseña ya entregada— igual
  // aparecía pidiendo una segunda aprobación redundante.
  await admin.from("profiles").update({ status: "active" }).eq("id", newId);

  let referralApplied = false;
  if (referral_code?.trim()) {
    // Recién creado, sin check-ins todavía: la ventana ni arrancó, así que
    // esto no debería poder fallar por plazo vencido — pero igual no
    // rompemos el alta si falla por otra razón (código ya usado, carrera
    // perdida contra el propio socio). El socio siempre puede cargarlo
    // después desde la app.
    const result = await applyReferralCode(admin, newId, referral_code);
    referralApplied = result.ok;
  }

  return NextResponse.json({
    ok: true,
    fullName: full_name.trim(),
    email: email.trim().toLowerCase(),
    tempPassword: password,
    referralApplied,
  });
}
