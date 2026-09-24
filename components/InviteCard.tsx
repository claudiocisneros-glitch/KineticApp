"use client";

import { useState } from "react";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";

// Ícono de fondo decorativo (mismo tratamiento que tenía el QR en la
// tarjeta de check-in que reemplazó a esta: grande, semitransparente,
// asomando por arriba del borde de la tarjeta). No había ningún asset de
// "invitación/regalo" en /public, así que va en SVG inline en vez de un
// .png nuevo.
function GiftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-24 text-[#f9f5f8]/90"
    >
      <rect x="3" y="9" width="18" height="11" rx="1.2" />
      <path d="M3 13h18" />
      <path d="M12 9v11" />
      <path d="M12 9C9.5 9 8 7.6 8 6a2 2 0 0 1 4 0 2 2 0 0 1 4 0c0 1.6-1.5 3-4 3Z" />
    </svg>
  );
}

export default function InviteCard({
  code,
  referredCount,
  threshold = 5,
}: {
  code: string;
  referredCount: number;
  threshold?: number;
}) {
  const [copied, setCopied] = useState(false);

  const msg = `¡Sumate a Kinetic Gym! 💪 Cuando te asocies, dá mi código ${code} y los dos ganamos puntos.`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;

  function copy() {
    try {
      navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const pct = Math.min(100, Math.round((referredCount / threshold) * 100));
  const remaining = Math.max(0, threshold - referredCount);

  return (
    <section className="bg-[#131315] border border-[rgba(255,144,109,0.2)] rounded-[24px] flex flex-col gap-6 items-center px-8 pt-[57px] pb-8 relative overflow-hidden">
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-90">
        <GiftIcon />
      </div>

      <div className="flex flex-col items-center gap-2 relative z-10 text-center">
        <h2 className="text-[#f9f5f8] font-black italic text-xl uppercase tracking-[-1px]">
          Invitá y ganá
        </h2>
        <p className="text-[#adaaad] text-sm max-w-[320px] leading-[22.75px]">
          Compartí tu código. Cuando tu amigo se asocie y haga su primer
          check-in, ganan{" "}
          <span className="text-[#ff906d] font-bold">300 KP</span> los dos.
        </p>
      </div>

      <div className="w-full flex flex-col gap-4 relative z-10">
        {/* Código + copiar */}
        <button
          onClick={copy}
          className="flex items-center justify-between bg-[#1f1f22] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-3"
        >
          <div className="text-left">
            <p className="text-[#adaaad] text-[10px] uppercase tracking-[1px]">
              Tu código
            </p>
            <p className="text-[#f9f5f8] font-black text-2xl tracking-[3px]">
              {code}
            </p>
          </div>
          <span className="text-[#ff906d] text-xs font-black uppercase tracking-[0.5px]">
            {copied ? "¡Copiado!" : "Copiar"}
          </span>
        </button>

        {/* WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl py-4 text-center text-black font-black text-sm uppercase tracking-[1.4px] shadow-[0px_4px_12px_rgba(255,120,77,0.3)]"
          style={{ backgroundImage: GRAD }}
        >
          Compartir por WhatsApp
        </a>

        {/* Progreso hacia el badge */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#adaaad]">Rey de los Referidos</span>
            <span className="text-[#adaaad] font-black">
              {referredCount}/{threshold}
            </span>
          </div>
          <div className="bg-[#232329] h-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundImage: GRAD }}
            />
          </div>
          <p className="text-[#adaaad]/70 text-[11px]">
            {remaining === 0
              ? "¡Ya te ganaste el badge!"
              : `Te faltan ${remaining} para el badge.`}
          </p>
        </div>
      </div>
    </section>
  );
}
