import { cookies } from "next/headers";

export type ViewMode = "mvp" | "pro";

const COOKIE_NAME = "kinetic_view_mode";

/**
 * Lee el modo de vista desde una cookie. Server-only.
 * Por diseño, el valor de la cookie NO alcanza para activar la vista
 * pro por sí solo — cada página que la usa también valida isStaff(user)
 * antes de mostrar contenido de showcase. Así, aunque alguien manipule
 * la cookie a mano, un socio común nunca ve las secciones de muestra.
 */
export function getViewMode(): ViewMode {
  const value = cookies().get(COOKIE_NAME)?.value;
  return value === "pro" ? "pro" : "mvp";
}

export const VIEW_MODE_COOKIE = COOKIE_NAME;
