"use client";

import { useState } from "react";

const REASON_LABELS: Record<string, string> = {
  checkin: "Check-in",
  redemption: "Canje",
  adjustment: "Ajuste manual",
  referral: "Referido",
  referral_welcome: "Bienvenida referido",
  reto60_milestone: "Hito Reto 60",
  reto60_complete: "Reto 60 completado",
};

type Checkin = { checkin_date: string; points_awarded: number };
type Ledger = {
  id: string;
  reason: string;
  created_at: string;
  amount: number;
};

export default function UserActivityTabs({
  checkins,
  ledger,
  checkinsCount,
}: {
  checkins: Checkin[];
  ledger: Ledger[];
  checkinsCount: number;
}) {
  const [tab, setTab] = useState<"asis" | "mov">("asis");

  return (
    <section>
      {/* Tabs con subrayado (no pill) */}
      <div className="flex border-b border-[rgba(72,71,74,0.2)] mb-3">
        {([
          ["asis", "Asistencias"],
          ["mov", "Movimientos"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px px-1 pb-2 mr-6 text-sm font-bold border-b-2 transition-colors ${
              tab === k
                ? "text-[#f9f5f8] border-[#ff906d]"
                : "text-[#adaaad] border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "asis" ? (
        checkins.length === 0 ? (
          <p className="text-[#adaaad] text-sm">
            Todavía no registró check-ins.
          </p>
        ) : (
          <div className="max-h-[360px] overflow-y-auto pr-1 flex flex-col gap-1">
            {checkins.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-1 py-2 border-b border-[rgba(72,71,74,0.1)]"
              >
                <p className="text-[#f9f5f8] text-xs">
                  {new Date(c.checkin_date).toLocaleDateString("es-AR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
                <span className="text-[#ff906d] font-black text-xs">
                  +{c.points_awarded} KP
                </span>
              </div>
            ))}
            {checkinsCount > checkins.length && (
              <p className="text-[#adaaad]/70 text-[10px] mt-1">
                Mostrando las {checkins.length} más recientes de {checkinsCount}{" "}
                en total.
              </p>
            )}
          </div>
        )
      ) : ledger.length === 0 ? (
        <p className="text-[#adaaad] text-sm">Sin movimientos todavía.</p>
      ) : (
        <div className="max-h-[360px] overflow-y-auto pr-1 flex flex-col gap-1">
          {ledger.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between px-1 py-2 border-b border-[rgba(72,71,74,0.1)]"
            >
              <div>
                <p className="text-[#f9f5f8] text-xs">
                  {REASON_LABELS[l.reason] ?? l.reason}
                </p>
                <p className="text-[#adaaad]/70 text-[10px]">
                  {new Date(l.created_at).toLocaleString("es-AR")}
                </p>
              </div>
              <span
                className={`font-black text-sm ${
                  l.amount >= 0 ? "text-[#ff906d]" : "text-[#adaaad]"
                }`}
              >
                {l.amount >= 0 ? "+" : ""}
                {l.amount} KP
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
