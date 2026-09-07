"use client";

import { useEffect, useState } from "react";
import type { Reto60Status } from "@/lib/reto60";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";

export type ChallengeView = {
  id: string;
  name: string;
  status: Reto60Status;
  milestones: readonly { at: number }[];
  prizeName: string | null;
  badgeIcon: string; // ruta al svg del badge
};

export default function Retos({ challenges }: { challenges: ChallengeView[] }) {
  const [showIntro, setShowIntro] = useState<ChallengeView | null>(null);

  const enCurso = challenges.filter(
    (c) => c.status.state === "active" || c.status.state === "not_started"
  );
  const finalizados = challenges.filter(
    (c) => c.status.state === "completed" || c.status.state === "expired"
  );

  useEffect(() => {
    const first = enCurso[0];
    if (!first) return;
    try {
      if (!localStorage.getItem(`reto_intro_seen_${first.id}`)) {
        setShowIntro(first);
      }
    } catch {
      // sin localStorage — no es crítico
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismissIntro() {
    if (showIntro) {
      try {
        localStorage.setItem(`reto_intro_seen_${showIntro.id}`, "1");
      } catch {}
    }
    setShowIntro(null);
  }

  if (challenges.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase">
        Retos
      </h2>

      {enCurso.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[#adaaad]/70 text-[11px] font-bold tracking-[1px] uppercase">
            En curso
          </p>
          {enCurso.map((c) => (
            <ActiveChallenge key={c.id} c={c} />
          ))}
        </div>
      )}

      {finalizados.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[#adaaad]/70 text-[11px] font-bold tracking-[1px] uppercase">
            Finalizados
          </p>
          {finalizados.map((c) => (
            <FinishedChallenge key={c.id} c={c} />
          ))}
        </div>
      )}

      {showIntro && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6">
          <div className="bg-[#131315] border border-[rgba(72,71,74,0.2)] rounded-3xl p-7 max-w-sm w-full text-center">
            <img src={showIntro.badgeIcon} alt="" className="size-16 mx-auto mb-4" />
            <h2 className="text-[#f9f5f8] font-black text-xl mb-2">
              Tu {showIntro.name} arrancó
            </h2>
            <p className="text-[#adaaad] text-sm leading-relaxed mb-4">
              Vení {showIntro.status.target} veces en los próximos 60 días. No
              hace falta que sea seguido — 3 veces por semana y llegás tranquilo.
            </p>
            <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.15)] rounded-xl p-3 mb-5 flex items-center gap-3 text-left">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-[#f9f5f8] text-xs font-bold">
                  Al completarlo ganás
                </p>
                <p className="text-[#adaaad] text-xs">
                  {showIntro.prizeName ?? "beneficios exclusivos"}
                </p>
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
    </section>
  );
}

function ActiveChallenge({ c }: { c: ChallengeView }) {
  const s = c.status;
  const notStarted = s.state === "not_started";
  const message = notStarted
    ? "Hacé tu primer check-in para arrancar."
    : s.toNext
    ? `Te faltan ${s.toNext} para tu próxima recompensa`
    : "¡Ya casi lo tenés!";

  return (
    <div className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[#f9f5f8] font-black text-lg tracking-[-0.4px]">
          {c.name}
        </h3>
        <span className="text-[#adaaad] text-xs">
          Quedan <span className="text-[#f9f5f8] font-black">{s.daysLeft}</span>{" "}
          días
        </span>
      </div>

      <div className="flex items-baseline gap-2 mt-4 mb-2">
        <span className="text-[#f9f5f8] font-black text-[32px] leading-none">
          {s.progress}
        </span>
        <span className="text-[#adaaad] text-sm">/ {s.target} check-ins</span>
      </div>

      <div className="h-2.5 bg-[#232329] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full"
          style={{ width: `${s.pct}%`, backgroundImage: GRAD }}
        />
      </div>

      <p className="text-[#f9f5f8] text-sm">{message}</p>

      <div className="flex justify-between mt-4">
        {c.milestones.map((m) => {
          const done = s.progress >= m.at;
          return (
            <div key={m.at} className="flex flex-col items-center gap-1.5 flex-1">
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
    </div>
  );
}

function FinishedChallenge({ c }: { c: ChallengeView }) {
  const s = c.status;
  const completed = s.state === "completed";

  return (
    <div
      className={`rounded-2xl p-4 flex items-center gap-4 border ${
        completed
          ? "bg-[#131315] border-[rgba(255,144,109,0.25)]"
          : "bg-[#131315] border-[rgba(72,71,74,0.1)] opacity-80"
      }`}
    >
      <img
        src={c.badgeIcon}
        alt=""
        className={`size-12 shrink-0 ${completed ? "" : "grayscale opacity-50"}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[#f9f5f8] font-bold text-sm truncate">{c.name}</p>
          {completed ? (
            <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.5px] text-[#ff906d] border border-[rgba(255,144,109,0.35)] rounded px-1.5 py-0.5">
              Completado
            </span>
          ) : (
            <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.5px] text-[#adaaad] border border-[rgba(72,71,74,0.25)] rounded px-1.5 py-0.5">
              No completado
            </span>
          )}
        </div>
        <p className="text-[#adaaad] text-xs mt-1">
          {completed
            ? "Ganaste el badge y tu premio."
            : `Llegaste a ${s.progress} de ${s.target}. La próxima la completás 💪`}
        </p>
      </div>
    </div>
  );
}
