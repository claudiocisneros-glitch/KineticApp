"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ViewMode } from "@/lib/view-mode";

// Reemplaza al ViewModeToggle que vivía suelto en el header (el pill
// "VISTA MVP/PRO" no entraba junto al logo + título en pantallas angostas
// y se pisaba con el resto del contenido). Ahora ese control vive adentro
// de un desplegable que se abre al tocar el avatar — mismo lugar donde
// antes había un círculo puramente decorativo.
export default function AvatarMenu({
  currentMode,
}: {
  currentMode: ViewMode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function toggleMode() {
    setLoading(true);
    const nextMode: ViewMode = currentMode === "pro" ? "mvp" : "pro";
    await fetch("/api/view-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: nextMode }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="border border-[#ff66b6] rounded-full size-8 shrink-0"
        aria-label="Menú de cuenta"
        aria-expanded={open}
      />

      {open && (
        <div className="absolute right-0 top-11 z-50 bg-[#1f1f22] border border-[rgba(72,71,74,0.2)] rounded-xl shadow-[0px_10px_25px_rgba(0,0,0,0.4)] py-2 w-52">
          <button
            onClick={toggleMode}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[#f9f5f8] text-xs font-bold uppercase tracking-[0.5px] disabled:opacity-50"
          >
            <span>Vista {currentMode === "pro" ? "Pro" : "MVP"}</span>
            <span
              className={`size-2 rounded-full ${
                currentMode === "pro" ? "bg-[#ff906d]" : "bg-[#adaaad]"
              }`}
            />
          </button>
          <p className="px-4 pt-1 pb-2 text-[9px] text-[#adaaad]/70 leading-snug">
            Solo vos ves esto — cambia entre la app real y una vista de
            muestra con el diseño completo.
          </p>
        </div>
      )}
    </div>
  );
}
