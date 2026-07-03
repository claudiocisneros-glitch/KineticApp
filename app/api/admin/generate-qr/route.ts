import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaff } from "@/lib/auth/staff";

// Genera un nuevo código QR válido por 24hs. Solo staff puede llamarlo.
// Es manual (el staff lo genera desde el panel) en vez de automático por
// cron — a propósito, para no sobre-construir infraestructura de
// scheduling antes de validar que el resto del loop funciona en el piloto.
export async function POST() {
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

  // Vence cualquier código todavía vigente ANTES de crear el nuevo.
  // Si no hiciéramos esto, quedarían dos códigos válidos al mismo tiempo:
  // rompe tanto la lógica de "un solo QR activo" como (más importante)
  // el propósito anti-abuso de que el código rote — el viejo seguiría
  // funcionando en paralelo.
  await admin
    .from("gym_qr_codes")
    .update({ valid_until: new Date().toISOString() })
    .gte("valid_until", new Date().toISOString());

  const code = `KINETIC-${randomUUID()}`;
  const validFrom = new Date();
  const validUntil = new Date(validFrom.getTime() + 24 * 60 * 60 * 1000);

  const { data, error } = await admin
    .from("gym_qr_codes")
    .insert({
      code,
      valid_from: validFrom.toISOString(),
      valid_until: validUntil.toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ qr: data });
}
