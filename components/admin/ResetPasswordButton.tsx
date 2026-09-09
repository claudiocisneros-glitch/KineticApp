"use client";

import { useState } from "react";

export default function ResetPasswordButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [newPass, setNewPass] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    if (
      !window.confirm(
        "¿Generar una contraseña temporal nueva para este socio? La anterior deja de funcionar."
      )
    ) {
      return;
    }
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: "POST",
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo resetear.");
      return;
    }
    setNewPass(data.tempPassword);
  }

  if (newPass) {
    return (
      <div className="mt-2 bg-[#0e0e10] border border-[rgba(255,144,109,0.25)] rounded-xl px-4 py-3">
        <p className="text-[#adaaad] text-xs">
          Contraseña temporal nueva — pasásela al socio (no se vuelve a
          mostrar):
        </p>
        <p className="text-[#f9f5f8] font-black tracking-[2px] text-lg mt-1">
          {newPass}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleReset}
        disabled={loading}
        className="text-[#adaaad] text-xs font-bold uppercase tracking-[0.5px] border border-[rgba(72,71,74,0.3)] rounded-full px-3 py-1.5 disabled:opacity-50"
      >
        {loading ? "..." : "Resetear contraseña"}
      </button>
      {error && <p className="text-[#ff66b6] text-xs mt-1">{error}</p>}
    </div>
  );
}
