"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ViewMode } from "@/lib/view-mode";

export default function ViewModeToggle({
  currentMode,
}: {
  currentMode: ViewMode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const nextMode: ViewMode = currentMode === "pro" ? "mvp" : "pro";
    await fetch("/api/view-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: nextMode }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[1px] transition-colors ${
        currentMode === "pro"
          ? "text-black"
          : "bg-[#262528] text-[#adaaad] border border-[rgba(72,71,74,0.3)]"
      }`}
      style={
        currentMode === "pro"
          ? {
              backgroundImage:
                "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
            }
          : undefined
      }
      title="Solo vos ves esto — cambia entre la app real (MVP) y una vista de muestra con el diseño completo"
    >
      <span
        className={`size-1.5 rounded-full ${
          currentMode === "pro" ? "bg-black" : "bg-[#adaaad]"
        }`}
      />
      {currentMode === "pro" ? "Vista Pro" : "Vista MVP"}
    </button>
  );
}
