"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AwardBadgeForm({
  members,
  badges,
}: {
  members: { id: string; name: string }[];
  badges: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [memberId, setMemberId] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!memberId || !badgeId) {
      setError("Elegí un socio y un badge.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/award-badge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: memberId, badgeId }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo otorgar el badge.");
      return;
    }

    setMemberId("");
    setBadgeId("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <select
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] flex-1"
      >
        <option value="">Elegir socio...</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <select
        value={badgeId}
        onChange={(e) => setBadgeId(e.target.value)}
        className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] flex-1"
      >
        <option value="">Elegir badge...</option>
        {badges.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl px-5 py-2.5 text-black text-xs font-black uppercase tracking-[0.5px] disabled:opacity-50 shrink-0"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
        }}
      >
        {loading ? "Otorgando..." : "Otorgar"}
      </button>
      {error && <p className="text-[#ff66b6] text-xs">{error}</p>}
    </form>
  );
}
