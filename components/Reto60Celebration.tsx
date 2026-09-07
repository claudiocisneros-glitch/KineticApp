"use client";

import { useEffect, useState } from "react";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";
const CONF = ["#ff7346", "#ff66b6", "#f9f5f8"];

export default function Reto60Celebration({
  onClose,
}: {
  onClose: () => void;
}) {
  const [confetti, setConfetti] = useState<
    { left: number; top: number; color: string; rot: number }[]
  >([]);

  useEffect(() => {
    setConfetti(
      Array.from({ length: 28 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 60,
        color: CONF[Math.floor(Math.random() * CONF.length)],
        rot: Math.random() * 360,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#0e0e10] flex items-center justify-center px-6">
      <div className="relative w-full max-w-sm text-center">
        {confetti.map((c, i) => (
          <span
            key={i}
            className="absolute size-1.5 rounded-[1px]"
            style={{
              left: `${c.left}%`,
              top: `${c.top}%`,
              backgroundColor: c.color,
              transform: `rotate(${c.rot}deg)`,
            }}
          />
        ))}

        <img
          src="/badges/reto-60.svg"
          alt="Badge Reto 60"
          className="size-32 mx-auto mb-5 relative z-10"
        />
        <h1 className="text-[#f9f5f8] font-black text-2xl mb-2 relative z-10">
          ¡Completaste el Reto 60!
        </h1>
        <p className="text-[#adaaad] text-sm mb-6 relative z-10">
          24 check-ins en 60 días. Sos parte del grupo que de verdad hizo el
          hábito.
        </p>
        <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.15)] rounded-xl px-5 py-3 mb-6 inline-flex items-center gap-2 relative z-10">
          <span>🎁</span>
          <span className="text-[#f9f5f8] font-bold text-sm">
            Tu premio ya está en Mis canjes
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-full rounded-xl py-3.5 text-black font-black text-sm uppercase tracking-[0.5px] relative z-10"
          style={{ backgroundImage: GRAD }}
        >
          Ver mi premio
        </button>
      </div>
    </div>
  );
}
