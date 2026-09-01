"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdjustPointsForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || Number.isNaN(parsedAmount)) {
      setError("Ingresá un número distinto de cero.");
      return;
    }
    if (!note.trim()) {
      setError("Contá el motivo del ajuste.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/adjust-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: parsedAmount, note: note.trim() }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo aplicar el ajuste.");
      return;
    }

    setAmount("");
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-3">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ej: 200 o -50"
          className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad] w-36"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Motivo (ej: bonus cumpleaños)"
          className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad] flex-1"
        />
      </div>
      {error && <p className="text-[#ff66b6] text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-xl px-5 py-2.5 text-black text-xs font-black uppercase tracking-[0.5px] disabled:opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
        }}
      >
        {loading ? "Aplicando..." : "Aplicar ajuste"}
      </button>
    </form>
  );
}
