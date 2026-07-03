import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con SERVICE ROLE KEY — bypassea RLS por completo.
 * SOLO se usa server-side (API routes), NUNCA en componentes cliente
 * ni se expone con el prefijo NEXT_PUBLIC_.
 *
 * Por qué existe: las API routes de check-in y canje necesitan escribir
 * en tablas (checkins, points_ledger, user_badges, redemptions) y leer
 * gym_qr_codes sin que el usuario final tenga permiso directo de hacerlo
 * vía la API pública de Supabase. En vez de abrir políticas de RLS que
 * expondrían esas tablas a cualquier cliente autenticado, la validación
 * de negocio vive en el servidor y usa esta key con privilegios.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
