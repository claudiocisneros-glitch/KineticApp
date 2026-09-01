"use client";

import { useMemo, useState } from "react";
import FulfillButton from "@/components/FulfillButton";

type Redemption = {
  id: string;
  memberName: string;
  rewardName: string;
  pointsSpent: number;
  status: "pending" | "fulfilled";
  createdAt: string;
};

export default function RedemptionsTable({
  redemptions,
}: {
  redemptions: Redemption[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "fulfilled">(
    "all"
  );

  const filtered = useMemo(() => {
    return redemptions.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (query && !r.memberName.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [redemptions, query, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por socio..."
          className="bg-[#1f1f22] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad] flex-1"
        />
        <div className="flex gap-2 shrink-0">
          {(["all", "pending", "fulfilled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-[0.5px]"
              style={
                statusFilter === s
                  ? { backgroundColor: "#ff906d", color: "#0e0e10" }
                  : { backgroundColor: "#1f1f22", color: "#adaaad" }
              }
            >
              {s === "all" ? "Todos" : s === "pending" ? "Pendientes" : "Entregados"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[#adaaad] text-xs">
        {filtered.length} de {redemptions.length} canjes
      </p>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-[#adaaad] text-sm">No hay canjes que coincidan.</p>
        )}
        {filtered.map((r) => (
          <div
            key={r.id}
            className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-[#f9f5f8] font-semibold text-sm truncate">
                {r.rewardName}
              </p>
              <p className="text-[#adaaad] text-xs mt-1">
                {r.memberName} · {r.pointsSpent} KP ·{" "}
                {new Date(r.createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>
            {r.status === "pending" ? (
              <FulfillButton redemptionId={r.id} />
            ) : (
              <span className="bg-[#ff906d]/10 text-[#ff906d] text-[10px] font-black uppercase px-3 py-2 rounded-full shrink-0">
                Entregado
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
