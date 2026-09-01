"use client";

import { useState } from "react";
import type { StaffRole } from "@/lib/auth/staff";
import BadgesManager from "@/components/admin/BadgesManager";
import AwardBadgeForm from "@/components/admin/AwardBadgeForm";

type Badge = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_url: string | null;
};

type Holder = { name: string; earnedAt: string };

export default function BadgesSection({
  role,
  badges,
  holdersByBadge,
  members,
}: {
  role: StaffRole;
  badges: Badge[];
  holdersByBadge: Record<string, Holder[]>;
  members: { id: string; name: string }[];
}) {
  // Recepción no gestiona el catálogo — solo ve Otorgados directo, sin
  // tabs (no tiene sentido mostrar un selector de una sola opción).
  const [tab, setTab] = useState<"catalog" | "awarded">("awarded");

  return (
    <div className="flex flex-col gap-6">
      {role === "owner" && (
        <div className="flex gap-2">
          {(
            [
              ["catalog", "Catálogo de badges"],
              ["awarded", "Otorgados"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.5px]"
              style={
                tab === key
                  ? {
                      backgroundImage:
                        "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
                      color: "#0e0e10",
                    }
                  : { backgroundColor: "#1f1f22", color: "#adaaad" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {role === "owner" && tab === "catalog" && <BadgesManager badges={badges} />}

      {(role !== "owner" || tab === "awarded") && (
        <div className="flex flex-col gap-6">
          <section className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
            <h2 className="text-[#f9f5f8] font-bold text-sm mb-3">
              Otorgar badge manualmente
            </h2>
            <AwardBadgeForm members={members} badges={badges.map((b) => ({ id: b.id, name: b.name }))} />
          </section>

          <div className="flex flex-col gap-4">
            {badges.map((b) => {
              const holders = holdersByBadge[b.id] ?? [];
              return (
                <div
                  key={b.id}
                  className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#f9f5f8] font-bold text-sm">{b.name}</p>
                      <p className="text-[#adaaad] text-xs mt-1">{b.description}</p>
                    </div>
                    <span className="text-[#ff906d] font-black text-lg shrink-0">
                      {holders.length}
                    </span>
                  </div>
                  {holders.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {holders.map((h, i) => (
                        <span
                          key={i}
                          className="bg-[#0e0e10] text-[#adaaad] text-[10px] px-2 py-1 rounded-full"
                        >
                          {h.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
