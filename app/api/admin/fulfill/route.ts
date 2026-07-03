import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaff } from "@/lib/auth/staff";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!isStaff(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { redemptionId } = await req.json();

  const { error } = await admin
    .from("redemptions")
    .update({ status: "fulfilled", fulfilled_at: new Date().toISOString() })
    .eq("id", redemptionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
