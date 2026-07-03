import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isStaff } from "@/lib/auth/staff";
import { VIEW_MODE_COOKIE } from "@/lib/view-mode";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Solo staff puede cambiar el modo — no tiene sentido que un socio
  // común pueda activar la vista de showcase.
  if (!user || !isStaff(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { mode } = await req.json();
  if (mode !== "mvp" && mode !== "pro") {
    return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
  }

  const res = NextResponse.json({ mode });
  res.cookies.set(VIEW_MODE_COOKIE, mode, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
  return res;
}
