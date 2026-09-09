"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApprovalActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function approve() {
    setLoading("approve");
    const res = await fetch(`/api/admin/approvals/${userId}`, {
      method: "POST",
    });
    setLoading(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "No se pudo aprobar.");
      return;
    }
    router.refresh();
  }

  async function reject() {
    if (
      !window.confirm(
        "¿Rechazar esta solicitud? Se elimina la cuenta y el socio tendría que registrarse de nuevo."
      )
    ) {
      return;
    }
    setLoading("reject");
    const res = await fetch(`/api/admin/approvals/${userId}`, {
      method: "DELETE",
    });
    setLoading(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "No se pudo rechazar.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={approve}
        disabled={loading !== null}
        className="rounded-lg px-4 py-2 text-black text-[10px] font-black uppercase tracking-[0.5px] disabled:opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
        }}
      >
        {loading === "approve" ? "..." : "Aprobar"}
      </button>
      <button
        onClick={reject}
        disabled={loading !== null}
        className="bg-[#262528] text-[#adaaad] text-[10px] font-black uppercase tracking-[0.5px] rounded-lg px-3 py-2 disabled:opacity-50"
      >
        {loading === "reject" ? "..." : "Rechazar"}
      </button>
    </div>
  );
}
