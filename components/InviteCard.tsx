"use client";

import { useState } from "react";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";

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
    <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-[#f9f5f8] font-black text-lg tracking-[-0.4px]">
          Invitá y ganá
        </h2>
        <p className="text-[#adaaad] text-xs mt-1 leading-relaxed">
          Compartí tu código. Cuando tu amigo se asocie y haga su primer
          check-in, ganan <span className="text-[#ff906d] font-bold">300 KP</span>{" "}
          los dos.
        </p>
      </div>

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
        className="rounded-xl py-3.5 text-center text-black font-black text-sm uppercase tracking-[0.5px]"
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
    </section>
  );
}
