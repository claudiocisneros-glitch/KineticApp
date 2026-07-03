"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RedeemButton({
  rewardId,
  cost,
  disabled,
  alreadyRedeemed = false,
}: {
  rewardId: string;
  cost: number;
  disabled: boolean;
  alreadyRedeemed?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [justRedeemed, setJustRedeemed] = useState(false);

  async function handleRedeem() {
    setLoading(true);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId }),
    });
    setLoading(false);

    if (res.ok) {
      setJustRedeemed(true);
      router.refresh();
      setTimeout(() => setJustRedeemed(false), 2500);
    } else {
      const data = await res.json();
      alert(data.error ?? "No se pudo canjear");
    }
  }

  if (alreadyRedeemed) {
    return (
      <button
        disabled
        className="bg-white/5 text-[#adaaad] text-xs font-bold rounded-xl py-2.5 w-full"
      >
        Ya canjeado
      </button>
    );
  }

  if (justRedeemed) {
    return (
      <button
        disabled
        className="bg-green-600 text-white text-xs font-bold rounded-xl py-2.5 w-full"
      >
        ¡Canjeado! ✓
      </button>
    );
  }

  return (
    <button
      onClick={handleRedeem}
      disabled={disabled || loading}
      className="relative flex items-center justify-center py-2.5 rounded-xl w-full font-bold text-sm text-white shadow-[0px_10px_15px_-3px_rgba(255,102,182,0.2),0px_4px_6px_-4px_rgba(255,102,182,0.2)] disabled:opacity-50 disabled:shadow-none"
      style={{
        backgroundImage:
          "linear-gradient(155deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
      }}
    >
      {loading ? "..." : "Canjear"}
    </button>
  );
}
