"use client";

import { useEffect, useState } from "react";
import type { Reto60Status } from "@/lib/reto60";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";
const BANNER =
  "linear-gradient(135deg, rgba(255,120,77,0.25) 0%, rgba(255,102,182,0.25) 100%)";

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
        <p className="text-[#adaaad]/60 text-sm text-center py-10">
          {tab === "curso"
            ? "No tenés retos en curso ahora mismo."
            : "Todavía no finalizaste ningún reto."}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
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
    </div>
  );
}

function ActiveCard({ c }: { c: ChallengeView }) {
  const s = c.status;
  const notStarted = s.state === "not_started";
  const message = notStarted
    ? "Hacé tu primer check-in para arrancar."
    : s.toNext
    ? `Te faltan ${s.toNext} para tu próxima recompensa`
    : "¡Ya casi lo tenés!";

  return (
    <div className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl overflow-hidden">
      {/* Banner */}
      <div
        className="relative h-32 flex items-center justify-center"
        style={{ backgroundImage: BANNER }}
      >
        <img src={c.badgeIcon} alt="" className="size-20" />
        <span className="absolute top-3 left-3 bg-[rgba(38,37,40,0.6)] backdrop-blur-md text-[#ff906d] text-[10px] font-bold px-2 py-1 rounded-lg">
          {notStarted ? "Sin empezar" : "En curso"}
        </span>
        <span className="absolute top-3 right-3 bg-[rgba(38,37,40,0.6)] backdrop-blur-md text-[#adaaad] text-[10px] font-bold px-2 py-1 rounded-lg">
          {s.daysLeft} días
        </span>
      </div>

      {/* Cuerpo */}
      <div className="p-5 flex flex-col gap-4">
        <div>
          <p className="text-[#f9f5f8] font-black text-lg tracking-[-0.4px]">
            {c.name}
          </p>
          <p className="text-[#adaaad] text-xs mt-1">{message}</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[11px] font-black">
            <span className="text-[#ff906d]">
              {s.progress} / {s.target} check-ins
            </span>
            <span className="text-[#adaaad]">{s.pct}%</span>
          </div>
          <div className="bg-[#262528] h-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${s.pct}%`, backgroundImage: GRAD }}
            />
          </div>
        </div>

        {/* Hitos */}
        <div className="flex justify-between">
          {c.milestones.map((m) => {
            const done = s.progress >= m.at;
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
                      : { backgroundColor: "#262528", borderColor: "#3a393c" }
                  }
                />
                <span
                  className={`text-[10px] ${
                    done ? "text-[#adaaad]" : "text-[#6b6a6d]"
                  }`}
                >
                  {m.at}
                </span>
              </div>
            );
          })}
        </div>

        {c.prizeName && (
          <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.15)] rounded-xl p-3 flex items-center gap-3">
            <span className="text-xl">🏆</span>
            <div className="min-w-0">
              <p className="text-[#f9f5f8] text-xs font-bold">Premio</p>
              <p className="text-[#adaaad] text-xs truncate">{c.prizeName}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FinishedCard({ c }: { c: ChallengeView }) {
  const s = c.status;
  const completed = s.state === "completed";

  return (
    <div
      className={`bg-[#131315] border rounded-2xl overflow-hidden ${
        completed
          ? "border-[rgba(255,144,109,0.25)]"
          : "border-[rgba(72,71,74,0.1)]"
      }`}
    >
      <div
        className="relative h-32 flex items-center justify-center"
        style={{ backgroundImage: completed ? BANNER : undefined }}
      >
        <img
          src={c.badgeIcon}
          alt=""
          className={`size-20 ${completed ? "" : "grayscale opacity-40"}`}
        />
        <span
          className={`absolute top-3 left-3 backdrop-blur-md text-[10px] font-bold px-2 py-1 rounded-lg ${
            completed
              ? "bg-[rgba(38,37,40,0.6)] text-[#ff906d]"
              : "bg-[rgba(38,37,40,0.6)] text-[#adaaad]"
          }`}
        >
          {completed ? "Completado" : "No completado"}
        </span>
      </div>

      <div className="p-5">
        <p className="text-[#f9f5f8] font-black text-lg tracking-[-0.4px]">
          {c.name}
        </p>
        <p className="text-[#adaaad] text-sm mt-1">
          {completed
            ? "Ganaste el badge y tu premio. ¡Bien ahí!"
            : `Llegaste a ${s.progress} de ${s.target}. La próxima la completás 💪`}
        </p>
      </div>
    </div>
  );
}
