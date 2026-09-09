import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback de OAuth (Google). Google → GoTrue → esta ruta. Acá se
// intercambia el "code" por una sesión y se deja la cookie seteada, después
// se redirige al home (que a su vez manda a /pendiente si la cuenta no está
// aprobada todavía).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si algo falló, vuelve al login con un flag de error.
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
