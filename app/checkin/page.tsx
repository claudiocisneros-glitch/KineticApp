"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import Reto60Celebration from "@/components/Reto60Celebration";

// stop() de esta librería puede tirar un error DE FORMA SÍNCRONA (no una
// promesa rechazada) si el scanner no estaba corriendo. Un simple
// `.catch(() => {})` no lo ataja porque el throw pasa antes de que exista
// la promesa para encadenar el .catch(). Por eso esta función envuelve
// todo en try/catch real.
async function safeStopAndClear(scanner: Html5Qrcode | null) {
  if (!scanner) return;
  try {
    await scanner.stop();
  } catch {
    // No estaba corriendo — no hay nada que parar, se ignora a propósito.
  }
  try {
    scanner.clear();
  } catch {
    // No había nada dibujado — se ignora a propósito.
  }
}

type Reto60Result = {
  progress: number;
  target: number;
  daysLeft: number;
  justCrossed: { at: number; kp: number; message: string } | null;
  completed: boolean;
} | null;

type CheckinResult = {
  breakdown: { total: number };
  newBadges: string[];
  reto60: Reto60Result;
};

export default function CheckinPage() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "scanning" | "loading" | "success" | "error"
  >("scanning");
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const qrRegionId = "qr-reader";
    let scanner: Html5Qrcode | null = null;
    let cancelled = false;
    let started = false;

    async function start() {
      scanner = new Html5Qrcode(qrRegionId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            if (cancelled) return;
            started = false;
            await safeStopAndClear(scanner);
            setStatus("loading");
            await handleCheckin(decodedText);
          },
          undefined
        );

        started = true;

        if (cancelled) {
          started = false;
          await safeStopAndClear(scanner);
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("No se pudo acceder a la cámara.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (started) {
        safeStopAndClear(scanner);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCheckin(code: string) {
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Error al procesar el check-in");
      return;
    }

    setResult(data);
    setStatus("success");

    // Si completó el Reto 60, mostramos la celebración y esperamos el tap.
    // Si no, redirigimos solos a los 2.5s.
    const completedReto = data.newBadges?.includes("reto_60");
    if (!completedReto) {
      setTimeout(() => router.push("/"), 2500);
    }
  }

  // Celebración a pantalla completa al completar el reto
  if (status === "success" && result?.newBadges?.includes("reto_60")) {
    return <Reto60Celebration onClose={() => router.push("/rewards/history")} />;
  }

  return (
    <main className="min-h-screen bg-[#0e0e10] flex flex-col items-center justify-center px-6">
      <h1 className="text-[#f9f5f8] text-2xl font-black mb-6">Check-in</h1>

      {status === "scanning" && (
        <div
          id="qr-reader"
          className="w-full max-w-xs rounded-2xl overflow-hidden border border-[rgba(72,71,74,0.2)]"
        />
      )}

      {status === "loading" && <p className="text-[#adaaad]">Procesando...</p>}

      {status === "success" && result && (
        <div className="text-center max-w-xs w-full">
          <p className="text-[#ff906d] font-black text-3xl">
            +{result.breakdown.total} KP
          </p>
          <p className="text-[#adaaad] mt-2">¡Buen entrenamiento!</p>

          {result.reto60 && (
            <div className="mt-6 bg-[#131315] border border-[rgba(72,71,74,0.15)] rounded-2xl p-4">
              {result.reto60.justCrossed ? (
                <p className="text-[#f9f5f8] font-bold text-sm">
                  🎉 {result.reto60.justCrossed.message}
                </p>
              ) : (
                <p className="text-[#f9f5f8] text-sm">
                  Reto 60: {result.reto60.progress} de {result.reto60.target}.
                  ¡Seguí así!
                </p>
              )}
              <div className="h-2 bg-[#232329] rounded-full overflow-hidden mt-3">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (result.reto60.progress / result.reto60.target) * 100
                      )
                    )}%`,
                    backgroundImage:
                      "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="text-center">
          <p className="text-[#ff66b6]">{message}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-[#adaaad] underline text-sm"
          >
            Volver al inicio
          </button>
        </div>
      )}
    </main>
  );
}
