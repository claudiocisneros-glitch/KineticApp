import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Callback de OAuth (Google). Google → GoTrue → esta ruta. Acá se
// intercambia el "code" por una sesión y se deja la cookie seteada, después
// se redirige al home (que a su vez manda a /pendiente si la cuenta no está
// aprobada todavía).
//
// "ref" (si viene) es el código de referido que el socio cargó en /registro
// antes de tocar "Continuar con Google". Antes de este fix se perdía en
// silencio: signInWithOAuth te saca de la página entera y el POST a
// /api/registro/referral nunca se disparaba para el camino de Google.
// Viaja acá como query param porque es el único dato que sobrevive el
// round-trip completo a Google y de vuelta.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const ref = searchParams.get("ref");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (ref?.trim() && data.user) {
        // Mismo criterio que /api/registro/referral: código inválido o
        // auto-referido no rompe el login, simplemente no vincula nada.
        const admin = createAdminClient();
        const { data: referrer } = await admin
          .from("profiles")
          .select("id")
          .eq("referral_code", ref.trim().toUpperCase())
          .maybeSingle();

        if (referrer && referrer.id !== data.user.id) {
          await admin
            .from("profiles")
            .update({ referred_by: referrer.id })
            .eq("id", data.user.id)
            .is("referred_by", null);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si algo falló, vuelve al login con un flag de error.
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
