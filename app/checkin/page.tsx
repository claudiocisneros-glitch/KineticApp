"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

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

export default function CheckinPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"scanning" | "loading" | "success" | "error">(
    "scanning"
  );
  const [message, setMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const qrRegionId = "qr-reader";
    let scanner: Html5Qrcode | null = null;
    let cancelled = false; // true si el cleanup corrió antes de que start() termine
    let started = false; // true solo si start() efectivamente resolvió

    async function start() {
      scanner = new Html5Qrcode(qrRegionId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            if (cancelled) return;
            started = false; // ya vamos a pararlo nosotros mismos
            await safeStopAndClear(scanner);
            setStatus("loading");
            await handleCheckin(decodedText);
          },
          undefined
        );

        started = true;

        // Si el cleanup ya corrió mientras start() todavía estaba en
        // vuelo (típico de React.StrictMode en desarrollo, o de Fast
        // Refresh al guardar un archivo), lo paramos apenas termina de
        // arrancar en vez de dejarlo corriendo sobre un componente ya
        // desmontado.
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

    setStatus("success");
    setMessage(`+${data.breakdown.total} KP`);
    setTimeout(() => router.push("/"), 2000);
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

      {status === "loading" && (
        <p className="text-[#adaaad]">Procesando...</p>
      )}

      {status === "success" && (
        <div className="text-center">
          <p className="text-[#ff906d] font-black text-3xl">{message}</p>
          <p className="text-[#adaaad] mt-2">¡Buen entrenamiento!</p>
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
