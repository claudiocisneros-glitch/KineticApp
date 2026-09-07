import { NextResponse } from "next/server";
 
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
 
// Diagnóstico temporal. Reporta si el runtime ve las variables de entorno.
// No expone secretos: la URL y la anon key son públicas (viajan al navegador
// igual); de la service role solo devuelve si existe (true/false).
// BORRAR este archivo una vez resuelto el tema.
export async function GET() {
  return NextResponse.json({
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anonLength: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").length,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseVarNames: Object.keys(process.env)
      .filter((k) => k.toUpperCase().includes("SUPABASE"))
      .sort(),
  });
}