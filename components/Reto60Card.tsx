"use client";

import { useEffect, useState } from "react";
import { RETO60, type Reto60Status } from "@/lib/reto60";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";

export default function Reto60Card({
  status,
  prizeName,
}: {
  status: Reto60Status;
  prizeName: string | null;
}) {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (status.completed || status.daysLeft <= 0) return;
    try {
      if (!localStorage.getItem("reto60_intro_seen")) setShowIntro(true);
    } catch {
      // sin localStorage — no se muestra, no es crítico
    }
  }, [status]);

  function dismissIntro() {
    try {
      localStorage.setItem("reto60_intro_seen", "1");
    } catch {}
    setShowIntro(false);
  }

  // Venció sin completar → no mostrar la card.
  if (!status.completed && status.daysLeft <= 0) return null;

  const prize = prizeName ?? "beneficios exclusivos";

  // ---- Card completada ----
  if (status.completed) {
    return (
      <section className="bg-[#131315] border border-[rgba(255,144,109,0.25)] rounded-2xl p-6 flex items-center gap-4">
        <img src="/badges/reto-60.svg" alt="" className="size-14 shrink-0" />
        <div>
          <p className="text-[#f9f5f8] font-black text-base">
            ¡Reto 60 completado!
          </p>
          <p className="text-[#adaaad] text-xs mt-1">
            Tu premio está en Mis canjes.
          </p>
        </div>
      </section>
    );
  }

  const notStarted = status.progress === 0;
  const message = notStarted
    ? "Hacé tu primer check-in para arrancar."
    : status.toNext
    ? `Te faltan ${status.toNext} para tu próxima recompensa`
    : "¡Ya casi lo tenés!";

  return (
    <>
      <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[#f9f5f8] font-black text-lg tracking-[-0.4px]">
            Reto 60
          </h2>
          <span className="text-[#adaaad] text-xs">
            Quedan{" "}
            <span className="text-[#f9f5f8] font-black">{status.daysLeft}</span>{" "}
            días
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-4 mb-2">
          <span className="text-[#f9f5f8] font-black text-[32px] leading-none">
            {status.progress}
          </span>
          <span className="text-[#adaaad] text-sm">
            / {status.target} check-ins
          </span>
        </div>

        <div className="h-2.5 bg-[#232329] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full"
            style={{ width: `${status.pct}%`, backgroundImage: GRAD }}
          />
        </div>

        <p className="text-[#f9f5f8] text-sm">{message}</p>

        <div className="flex justify-between mt-4">
          {RETO60.milestones.map((m) => {
            const done = status.progress >= m.at;
            return (
              <div
                key={m.at}
                className="flex flex-col items-center gap-1.5 flex-1"
              >
                <span
                  className="size-2.5 rounded-full border-2"
                  style={
                    done
                      ? { backgroundColor: "#ff66b6", borderColor: "#ff66b6" }
                      : { backgroundColor: "#232329", borderColor: "#2A2A30" }
                  }
                />
                <span
                  className={`text-[10px] ${
                    done ? "text-[#adaaad]" : "text-[#5E5E67]"
                  }`}
                >
                  {m.at}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {showIntro && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6">
          <div className="bg-[#131315] border border-[rgba(72,71,74,0.2)] rounded-3xl p-7 max-w-sm w-full text-center">
            <img
              src="/badges/reto-60.svg"
              alt=""
              className="size-16 mx-auto mb-4"
            />
            <h2 className="text-[#f9f5f8] font-black text-xl mb-2">
              Tu Reto 60 arrancó
            </h2>
            <p className="text-[#adaaad] text-sm leading-relaxed mb-4">
              Vení {RETO60.target} veces en los próximos {RETO60.windowDays}{" "}
              días. No hace falta que sea seguido — 3 veces por semana y llegás
              tranquilo.
            </p>
            <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.15)] rounded-xl p-3 mb-5 flex items-center gap-3 text-left">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-[#f9f5f8] text-xs font-bold">
                  Al completarlo ganás
                </p>
                <p className="text-[#adaaad] text-xs">{prize}</p>
              </div>
            </div>
            <button
              onClick={dismissIntro}
              className="w-full rounded-xl py-3 text-black font-black text-sm uppercase tracking-[0.5px]"
              style={{ backgroundImage: GRAD }}
            >
              Empecemos
            </button>
          </div>
        </div>
      )}
    </>
  );
}
