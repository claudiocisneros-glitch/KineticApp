import { createBrowserClient } from "@supabase/ssr";

// Reemplazar las env vars en .env.local con las de tu proyecto real de Supabase
// (esto es lo primero que hay que configurar al abrir el proyecto en Claude Code)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
