"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Member = {
  id: string;
  fullName: string;
  memberSince: string;
  currentStreakWeeks: number;
  lastCheckinAt: string | null;
  balance: number;
  totalCheckins: number;
};

// Mismo umbral que usa el badge "Volviste" (14+ días sin check-in) —
// así "en riesgo" acá significa lo mismo en todos lados de la app.
const INACTIVE_DAYS_THRESHOLD = 14;

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function UsersTable({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [onlyInactive, setOnlyInactive] = useState(false);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesQuery = m.fullName.toLowerCase().includes(query.toLowerCase());
      if (!matchesQuery) return false;
      if (onlyInactive) {
        const days = daysSince(m.lastCheckinAt);
        if (days === null || days < INACTIVE_DAYS_THRESHOLD) return false;
      }
      return true;
    });
  }, [members, query, onlyInactive]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre..."
          className="bg-[#1f1f22] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad] flex-1"
        />
        <button
          onClick={() => setOnlyInactive((v) => !v)}
          className="rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-[0.5px] shrink-0"
          style={
            onlyInactive
              ? { backgroundColor: "#ff906d", color: "#0e0e10" }
              : { backgroundColor: "#1f1f22", color: "#adaaad" }
          }
        >
          Inactivos 14+ días
        </button>
      </div>

      <p className="text-[#adaaad] text-xs">
        {filtered.length} de {members.length} socios
      </p>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-[#adaaad] text-sm">No hay socios que coincidan.</p>
        )}
        {filtered.map((m) => {
          const days = daysSince(m.lastCheckinAt);
          const isInactive = days !== null && days >= INACTIVE_DAYS_THRESHOLD;
          return (
            <Link
              key={m.id}
              href={`/admin/users/${m.id}`}
              className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-[#f9f5f8] font-bold text-sm truncate">
                  {m.fullName}
                </p>
                <p className="text-[#adaaad] text-xs mt-1">
                  Socio desde {new Date(m.memberSince).toLocaleDateString("es-AR")}
                  {" · "}
                  {m.totalCheckins} check-ins · racha {m.currentStreakWeeks} sem.
                </p>
                <p
                  className={`text-[10px] font-bold uppercase mt-1 ${
                    isInactive ? "text-[#ff66b6]" : "text-[#adaaad]/70"
                  }`}
                >
                  {days === null
                    ? "Sin check-ins todavía"
                    : days === 0
                    ? "Check-in hoy"
                    : `Último check-in hace ${days} días`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[#ff906d] font-black text-lg">
                  {m.balance.toLocaleString()} KP
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
