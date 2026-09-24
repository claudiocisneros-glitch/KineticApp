import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyReferralCode } from "@/lib/referrals";

// El propio socio carga el código de quien lo recomendó — desde el check-in
// o desde el modal de recordatorio en el home (ver ReferralReminderModal).
// La validación de ventana y la carrera limpia contra el staff viven en
// lib/referrals.ts, compartidas con /api/admin/users.
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { code } = await req.json().catch(() => ({ code: undefined }));
  const admin = createAdminClient();
  const result = await applyReferralCode(admin, user.id, code);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, welcomeKp: result.welcomeKp });
}
