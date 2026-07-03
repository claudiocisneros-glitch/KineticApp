import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = createClient(); // identifica al usuario
  const admin = createAdminClient(); // ejecuta el canje con privilegios

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { rewardId } = await req.json();

  // La función redeem_reward hace todo en una transacción atómica:
  // valida saldo, descuenta puntos y crea el canje — sin espacio para
  // condiciones de carrera entre dos clics simultáneos.
  const { data, error } = await admin.rpc("redeem_reward", {
    p_user_id: user.id,
    p_reward_id: rewardId,
  });

  if (error) {
    const friendlyMessage = error.message.includes("Puntos insuficientes")
      ? "No tenés puntos suficientes"
      : error.message.includes("no encontrada")
      ? "Recompensa no disponible"
      : "No se pudo procesar el canje";

    return NextResponse.json({ error: friendlyMessage }, { status: 400 });
  }

  return NextResponse.json({ redemption: data?.[0] });
}
