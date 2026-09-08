"use client";

import { useEffect, useState } from "react";
import type { Reto60Status } from "@/lib/reto60";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";
// Foco de luz detrás del badge — le da impacto sin tapar el medallón.
const GLOW =
  "radial-gradient(circle at 50% 42%, rgba(255,102,182,0.45) 0%, rgba(255,120,77,0.18) 55%, rgba(19,19,21,0) 78%)";

export type ChallengeView = {
  id: string;
  name: string;
  status: Reto60Status;
  milestones: readonly { at: number }[];
  prizeName: string | null;
  badgeIcon: string;
};

export default function RetosView({
  challenges,
}: {
  challenges: ChallengeView[];
}) {
  const [tab, setTab] = useState<"curso" | "final">("curso");
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
    } catch {}
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

  const list = tab === "curso" ? enCurso : finalizados;

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {(
          [
            ["curso", `En curso${enCurso.length ? ` (${enCurso.length})` : ""}`],
            [
              "final",
              `Finalizados${finalizados.length ? ` (${finalizados.length})` : ""}`,
            ],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 rounded-full py-2.5 text-xs font-black uppercase tracking-[0.5px]"
            style={
              tab === key
                ? { backgroundImage: GRAD, color: "#0e0e10" }
                : { backgroundColor: "#1f1f22", color: "#adaaad" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {list.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {list.map((c) =>
            tab === "curso" ? (
              <ActiveCard key={c.id} c={c} />
            ) : (
              <FinishedCard key={c.id} c={c} />
            )
          )}
        </div>
      )}

      {showIntro && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6">
          <div className="bg-[#131315] border border-[rgba(72,71,74,0.2)] rounded-3xl p-7 max-w-sm w-full text-center">
            <img src={showIntro.badgeIcon} alt="" className="size-20 mx-auto mb-4" />
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
    </div>
  );
}

function EmptyState({ tab }: { tab: "curso" | "final" }) {
  const copy =
    tab === "curso"
      ? {
          title: "No hay retos en curso",
          desc: "Cuando lancemos un reto nuevo te avisamos por notificación para que no te lo pierdas.",
        }
      : {
          title: "Sin retos finalizados",
          desc: "Acá vas a ver los retos que completes o que se te pasen.",
        };
  return (
    <div className="text-center py-14 px-6">
      <p className="text-[#f9f5f8] font-black text-base">{copy.title}</p>
      <p className="text-[#adaaad] text-sm mt-2 max-w-[280px] mx-auto leading-relaxed">
        {copy.desc}
      </p>
    </div>
  );
}

// Card ocupa una "celda" de la grilla de 2 (no se estira al ancho completo).
function ActiveCard({ c }: { c: ChallengeView }) {
  const s = c.status;
  const notStarted = s.state === "not_started";
  const sub = notStarted ? "Sin empezar" : `Quedan ${s.daysLeft} días`;

  return (
    <div className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl overflow-hidden flex flex-col">
      <div
        className="relative h-28 flex items-center justify-center"
        style={{ backgroundImage: GLOW }}
      >
        <img src={c.badgeIcon} alt="" className="size-20" />
        <span className="absolute top-2 left-2 bg-[rgba(38,37,40,0.6)] backdrop-blur-md text-[#ff906d] text-[9px] font-bold px-2 py-1 rounded-lg">
          {notStarted ? "Sin empezar" : "En curso"}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div>
          <p className="text-[#f9f5f8] font-bold text-sm">{c.name}</p>
          <p className="text-[#adaaad] text-[10px] mt-0.5">{sub}</p>
        </div>

        <div className="flex flex-col gap-1.5 mt-auto">
          <div className="flex justify-between text-[10px] font-black">
            <span className="text-[#ff906d]">
              {s.progress}/{s.target}
            </span>
            <span className="text-[#adaaad]">{s.pct}%</span>
          </div>
          <div className="bg-[#262528] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${s.pct}%`, backgroundImage: GRAD }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FinishedCard({ c }: { c: ChallengeView }) {
  const s = c.status;
  const completed = s.state === "completed";

  return (
    <div
      className={`bg-[#131315] border rounded-2xl overflow-hidden flex flex-col ${
        completed
          ? "border-[rgba(255,144,109,0.25)]"
          : "border-[rgba(72,71,74,0.1)]"
      }`}
    >
      <div
        className="relative h-28 flex items-center justify-center"
        style={completed ? { backgroundImage: GLOW } : undefined}
      >
        <img
          src={c.badgeIcon}
          alt=""
          className={`size-20 ${completed ? "" : "grayscale opacity-40"}`}
        />
        <span
          className={`absolute top-2 left-2 backdrop-blur-md text-[9px] font-bold px-2 py-1 rounded-lg bg-[rgba(38,37,40,0.6)] ${
            completed ? "text-[#ff906d]" : "text-[#adaaad]"
          }`}
        >
          {completed ? "Completado" : "No completado"}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <p className="text-[#f9f5f8] font-bold text-sm">{c.name}</p>
        <p className="text-[#adaaad] text-[10px] leading-snug">
          {completed
            ? "Ganaste el badge y tu premio."
            : `Llegaste a ${s.progress} de ${s.target}. La próxima la completás 💪`}
        </p>
      </div>
    </div>
  );
}
