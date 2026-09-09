import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Vincula al nuevo socio con quien lo refirió, tras el registro. El socio ya
// está logueado (autoconfirm), así que tomamos su id de la sesión.
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code?.trim()) {
    return NextResponse.json({ ok: true, applied: false });
  }

  const admin = createAdminClient();
  const { data: ref } = await admin
    .from("profiles")
    .select("id")
    .eq("referral_code", code.trim().toUpperCase())
    .maybeSingle();

  if (!ref || ref.id === user.id) {
    return NextResponse.json({ ok: true, applied: false });
  }

  await admin
    .from("profiles")
    .update({ referred_by: ref.id })
    .eq("id", user.id)
    .is("referred_by", null);

  return NextResponse.json({ ok: true, applied: true });
}
