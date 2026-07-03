# Kinetic Gym — Piloto MVP

Scaffold inicial construido a partir del diseño en Figma y las reglas de
gamificación definidas (puntos, badges, recompensas). Pensado para que lo
sigas construyendo en **Claude Code**, conectado a tu propio proyecto de
Supabase.

## Qué incluye este scaffold

- Next.js 14.2.35 (App Router, versión parcheada) + Tailwind con los
  colores/tipografía reales sacados del Design System de tu Figma.
- Esquema completo de base de datos (`supabase/schema.sql`) con las
  tablas de perfiles, check-ins, ledger de puntos, badges y recompensas,
  RLS activado en todas, y una función atómica para el canje.
- Motor de puntos (`lib/points-engine.ts`) que implementa exactamente la
  regla acordada: base + bonus de arranque + racha + antigüedad.
- Pantallas: Login, Home, Check-in (con lector de QR real), Rewards.
- Panel admin (`/admin`, protegido por allowlist de staff) con: generar
  el QR del día, y marcar canjes como entregados.
- Seed con las 4 recompensas del piloto ya cargadas.

## Cómo verificar vos mismo (no solo confiar en lo que digo)

No hace falta que me creas de que "ya lo revisé" — podés correr las
mismas verificaciones vos:

```bash
npm install
npx tsc --noEmit      # errores de tipos
npm audit             # vulnerabilidades conocidas en dependencias
npm run build         # compila todo de verdad
```

Y en el dashboard de Supabase: **Database → Advisors** — detecta
automáticamente tablas sin RLS, políticas faltantes, y otros problemas
de seguridad comunes. Vale la pena correrlo ahí de nuevo antes de
invitar al primer socio real, y de nuevo antes de cualquier cambio
grande al esquema.

## Cómo arrancar (en Claude Code, no en este chat)

1. **Creá un proyecto en [supabase.com](https://supabase.com)** (plan gratuito alcanza para el piloto).
2. En el SQL Editor de Supabase, corré en orden:
   - `supabase/schema.sql`
   - `supabase/seed.sql`
3. Copiá `.env.local.example` a `.env.local` y completá con la URL y
   anon key de tu proyecto (Project Settings → API).
4. `npm install`
5. `npm run dev` y abrí `http://localhost:3000`

## Auditoría de seguridad y funcionalidad — 2 de julio

Antes de seguir sumando features, hice una pasada completa: no solo leer
el código, sino instalar dependencias, correr `npm audit` y verificar
tipos con el compilador real. Esto es lo que encontré y corregí:

**Seguridad:**
1. RLS incompleto (faltaban políticas de INSERT/UPDATE, `gym_qr_codes`
   sin RLS) → resuelto separando escrituras sensibles a un cliente con
   service role (`lib/supabase/admin.ts`).
2. `/admin` sin ningún control de acceso (ni pedía login) → se agregó
   una allowlist de staff por variable de entorno (`STAFF_EMAILS`),
   centralizada en `lib/auth/staff.ts` para que no se duplique (y
   eventualmente se olvide) en cada ruta nueva.
3. **Next.js 14.2.5 tenía una vulnerabilidad crítica conocida**
   (detectado con `npm audit`) → actualizado a 14.2.35, el último parche
   disponible en la rama 14.x. Quedan algunas vulnerabilidades de menor
   severidad que solo se resuelven saltando a Next 16 (versión mayor,
   rompe compatibilidad) — decisión que dejo pendiente a propósito, no
   la tomo yo solo.
4. Condición de carrera en el canje de puntos (dos clics rápidos podían
   dejar el balance en negativo) → resuelto con una función de Postgres
   atómica (`redeem_reward`) con lock de fila, en vez de dos pasos
   sueltos desde el código.

**Funcionalidad (bugs que hubieran roto el piloto en la práctica):**
5. Faltaba el trigger que crea el perfil al registrarse → sin esto, un
   socio nuevo real se rompía al loguearse.
6. **No había manera de generar el QR real del gimnasio** — solo existía
   el código de prueba del seed. Se agregó al panel admin: botón para
   generar el QR del día (válido 24hs) y mostrarlo para exhibir en
   recepción.
7. Nada impedía múltiples check-ins el mismo día — un socio podía
   escanear el mismo QR varias veces y sumar puntos sin límite. Se
   cerró con una restricción UNIQUE a nivel de base de datos
   (`user_id` + `checkin_date`), no solo una validación en el código.
8. Error de tipado en `lib/supabase/server.ts` detectado por el
   compilador de TypeScript (`tsc --noEmit`), corregido.

## Lo que falta resolver (a propósito, no es un olvido)

Estas cosas están marcadas con comentarios `NOTA` o `PENDIENTE` en el
código, para que se resuelvan con intención en vez de quedar implícitas:

- **Cálculo real de racha semanal**: `current_streak_weeks` hoy se lee
  directo de `profiles`, pero falta la función que la actualice
  (se corta si pasa una semana calendario sin check-in). Es lo primero
  a resolver.
- **Rotación automática del QR**: ya se puede generar manualmente desde
  `/admin`, pero sigue siendo una acción manual del staff (a propósito,
  para no sobre-construir infraestructura de scheduling antes de
  validar el resto). Automatizarlo con un cron diario es una mejora de
  Fase 1, no bloqueante para arrancar el piloto.
- **Registro de nuevos usuarios**: solo está armado el login; falta la
  pantalla de alta (`/signup`), sencilla de sumar con
  `supabase.auth.signUp`.
- **Next.js 16**: quedan algunas vulnerabilidades menores en `npm audit`
  que solo se resuelven con el salto de versión mayor — evaluar cuándo
  conviene hacerlo (ver sección de auditoría arriba).

## Sobre el diseño

Las pantallas de este scaffold son una versión funcional simplificada
del diseño original de Figma — no un pixel-perfect todavía. La idea es
que en Claude Code, con el conector de Figma, vayamos ajustando cada
pantalla al detalle visual real mientras se prueba que la lógica
funciona.
