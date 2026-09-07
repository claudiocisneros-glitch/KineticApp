import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/auth/staff";

// Crear una recompensa nueva. Solo Dueño.
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

  const { name, description, cost_points, max_redemptions_per_user, reward_trigger } =
    await req.json();

  const trigger = reward_trigger === "reto_60" ? "reto_60" : null;

  // El costo solo es obligatorio para canje normal. El premio del Reto 60
  // se entrega gratis, así que va con costo 0.
  if (!name || (trigger === null && (typeof cost_points !== "number" || cost_points < 0))) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("rewards").insert({
    name,
    description: description ?? null,
    cost_points: trigger === "reto_60" ? 0 : cost_points,
    max_redemptions_per_user: max_redemptions_per_user ?? null,
    reward_trigger: trigger,
  });

  if (error) {
    // El índice único bloquea tener dos premios del Reto 60 a la vez.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya hay una recompensa marcada como premio del Reto 60. Cambiá la otra primero." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
