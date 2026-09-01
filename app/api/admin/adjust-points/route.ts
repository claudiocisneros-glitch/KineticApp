import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/auth/staff";

// Ajuste manual de puntos — solo Dueño (no Recepción). Usa la función
// adjust_points (RPC) definida en supabase/admin_panel_migration.sql,
// que lockea la fila del socio igual que redeem_reward, para que un
// ajuste y un canje simultáneos no puedan pisarse.
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

  const { userId, amount, note } = await req.json();

  if (!userId || typeof amount !== "number" || !amount || !note) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("adjust_points", {
    p_user_id: userId,
    p_amount: amount,
    p_note: note,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
