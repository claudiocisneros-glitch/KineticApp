"use client";

import { useEffect, useState } from "react";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";
const DISMISS_KEY = "kinetic_ref_reminder_dismissed";

export default function ReferralReminderModal({
  daysLeft,
}: {
  daysLeft: number;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "applied" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Se puede posponer, pero vuelve a aparecer al día siguiente si el
    // socio todavía no cargó nada — no queremos que un solo "ahora no"
    // le tape el recordatorio los 7 días enteros.
    const today = new Date().toISOString().slice(0, 10);
    let dismissedAt: string | null = null;
    try {
      dismissedAt = localStorage.getItem(DISMISS_KEY);
    } catch {
      // Sin storage disponible: mostramos igual, no es crítico.
    }
    if (dismissedAt !== today) setOpen(true);
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString().slice(0, 10));
    } catch {
      // No hay storage — no pasa nada, solo vuelve a aparecer antes.
    }
  }

  async function apply() {
    if (!code.trim()) return;
    setStatus("loading");
    setMessage(null);
    const res = await fetch("/api/referidos/aplicar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "No se pudo cargar el código.");
      return;
    }
    setStatus("applied");
    setMessage(
      data.welcomeKp > 0
        ? `¡Listo! +${data.welcomeKp} KP de bienvenida.`
        : "¡Código cargado!"
    );
    try {
      localStorage.removeItem(DISMISS_KEY);
    } catch {
      // No hay storage — sin problema.
    }
    setTimeout(() => window.location.reload(), 1500);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6">
      <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.15)] rounded-2xl p-6 max-w-sm w-full">
        {status === "applied" ? (
          <p className="text-[#ff906d] font-black text-center py-2">
            {message}
          </p>
        ) : (
          <>
            <p className="text-[#f9f5f8] font-black text-lg">
              ¿Te recomendó un socio?
            </p>
            <p className="text-[#adaaad] text-sm mt-1 mb-4">
              Cargá su código y los dos suman KP. Te queda{daysLeft === 1 ? "" : "n"}{" "}
              {daysLeft} día{daysLeft === 1 ? "" : "s"} para hacerlo.
            </p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Código"
                disabled={status === "loading"}
                className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-3 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[rgba(118,117,119,0.5)] flex-1 focus:outline-none focus:border-[#ff906d] disabled:opacity-50"
              />
              <button
                onClick={apply}
                disabled={status === "loading" || !code.trim()}
                className="rounded-xl px-4 text-black text-xs font-black uppercase tracking-[0.5px] disabled:opacity-50 shrink-0"
                style={{ backgroundImage: GRAD }}
              >
                {status === "loading" ? "..." : "Cargar"}
              </button>
            </div>
            {message && (
              <p className="text-[#ff66b6] text-xs mt-2">{message}</p>
            )}
            <button
              onClick={dismiss}
              className="text-[#adaaad] text-xs underline mt-4 block mx-auto"
            >
              Ahora no
            </button>
          </>
        )}
      </div>
    </div>
  );
}
