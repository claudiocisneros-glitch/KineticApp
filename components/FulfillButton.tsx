"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FulfillButton({
  redemptionId,
}: {
  redemptionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFulfill() {
    setLoading(true);
    const res = await fetch("/api/admin/fulfill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redemptionId }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={handleFulfill}
      disabled={loading}
      className="bg-[#ff906d] text-black text-sm font-bold rounded-xl px-4 py-2"
    >
      {loading ? "..." : "Entregado"}
    </button>
  );
}
