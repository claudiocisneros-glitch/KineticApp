"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function QrGenerator({
  currentCode,
  lastGeneratedAt,
  generatedToday,
}: {
  currentCode: string | null;
  lastGeneratedAt?: string | null;
  generatedToday?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const res = await fetch("/api/admin/generate-qr", { method: "POST" });
    setLoading(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo generar el QR");
      router.refresh();
    }
  }

  const disabled = loading || Boolean(generatedToday);

  return (
    <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-6 text-center mb-8">
      <h2 className="text-[#f9f5f8] font-bold mb-4">QR del gimnasio (hoy)</h2>

      {currentCode ? (
        <div className="bg-white inline-block p-4 rounded-xl">
          <QRCodeSVG value={currentCode} size={200} />
        </div>
      ) : (
        <p className="text-[#adaaad] text-sm mb-4">
          No hay un QR generado hoy todavía.
        </p>
      )}

      <button
        onClick={handleGenerate}
        disabled={disabled}
        className="block mx-auto mt-4 text-black font-bold rounded-xl px-6 py-3 disabled:opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
        }}
      >
        {loading
          ? "Generando..."
          : generatedToday
          ? "Ya generado hoy"
          : "Generar QR de hoy"}
      </button>
      <p className="text-[#adaaad]/60 text-xs mt-2">
        {lastGeneratedAt
          ? `Última generación: ${new Date(lastGeneratedAt).toLocaleString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : "Todavía no se generó ningún QR."}
      </p>
      <p className="text-[#adaaad]/60 text-xs mt-1">
        Se puede generar una sola vez por día. Válido 24hs — imprimilo o
        mostralo en una pantalla en recepción.
      </p>
    </div>
  );
}
