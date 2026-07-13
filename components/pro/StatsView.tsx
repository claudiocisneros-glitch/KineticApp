"use client";

// Contenido de MUESTRA (igual criterio que el resto de la vista Pro):
// diseño completo de Figma para la sección Stats, con datos de ejemplo.
// Cuando se sume tracking real (biometría / GPS del gimnasio) esto se
// calcula de check-ins reales, siempre condicionado a que el usuario esté
// dentro de la cobertura GPS del gym.

import { useId, useState } from "react";
import imgDeadlift from "../../imgs/Img2.png";

function CircularProgress({
  percent,
  size = 64,
  stroke = 6,
  label,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  // Cada instancia necesita su propio id de gradiente — dos <linearGradient>
  // con el mismo id en el DOM es inválido y en Chrome de Android puede
  // corromper el render de las demás instancias (esto causaba el glitch
  // tipo "estática" reportado en mobile).
  const gradId = `gradStats-${useId()}`;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#262528"
          strokeWidth={stroke}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(255,120,77)" />
            <stop offset="100%" stopColor="rgb(255,102,182)" />
          </linearGradient>
        </defs>
      </svg>
      {label && (
        <span className="absolute text-[#f9f5f8] font-black text-xs">
          {label}
        </span>
      )}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#adaaad" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="5.5" />
      <path d="M7 4v3l2 1.3" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#adaaad" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 10l2.5-5L6 9l2-6 2.5 5H13" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#ff66b6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5s-4 4-4 8a4 4 0 0 0 8 0c0-1.3-.6-2.3-1.2-3.1.2 1-.2 1.8-.9 2.1C11.6 6.8 11 5 9 1.5Z" />
    </svg>
  );
}

function YieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#ff906d" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="9" width="3" height="7" rx="0.8" />
      <rect x="7.5" y="5.5" width="3" height="10.5" rx="0.8" />
      <rect x="13" y="2" width="3" height="14" rx="0.8" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#ff906d" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.7 3.3l-1 1M4.3 11.7l-1 1M12.7 12.7l-1-1M4.3 4.3l-1-1" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#ff66b6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 12.5 6 7l3 3 5.5-6.5" />
      <path d="M10.5 3.5H14.5V7.5" />
    </svg>
  );
}

function WatchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#f9f5f8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="8" height="8" rx="2" />
      <path d="M7 5V2.5h4V5M7 13v2.5h4V13" />
    </svg>
  );
}

const week = [
  { d: "M", value: 8 },
  { d: "T", value: 68 },
  { d: "W", value: 42 },
  { d: "T", value: 80 },
  { d: "F", value: 55 },
  { d: "S", value: 6 },
  { d: "S", value: 6 },
];
const bestDayIndex = 3;

export default function StatsView() {
  const [tab, setTab] = useState<"activity" | "goals">("activity");
  const maxValue = Math.max(...week.map((d) => d.value));

  return (
    <div className="flex flex-col gap-5">
      {/* Weekly momentum */}
      <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#adaaad] text-[10px] font-black uppercase tracking-[2px]">
              Momentum semanal
            </p>
            <p className="font-black text-[32px] tracking-[-1px] pt-1 bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, rgb(255,120,77) 0%, rgb(255,102,182) 100%)" }}>
              +1.250 KP
            </p>
          </div>
          <CircularProgress percent={75} label="75%" />
        </div>

        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <ActivityIcon />
            <div>
              <p className="text-[#adaaad] text-[9px] font-bold uppercase tracking-[1px]">
                Actividades
              </p>
              <p className="text-[#f9f5f8] font-black text-sm">2</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon />
            <div>
              <p className="text-[#adaaad] text-[9px] font-bold uppercase tracking-[1px]">
                Tiempo
              </p>
              <p className="text-[#f9f5f8] font-black text-sm">3h 20m</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#f9f5f8] font-bold">
              2 sesiones completadas hoy
            </span>
            <span className="text-[#adaaad]">Próxima: Full Body</span>
          </div>
          <div className="bg-[#262528] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: "66%", backgroundImage: "linear-gradient(90deg, rgb(255,120,77) 0%, rgb(255,102,182) 100%)" }}
            />
          </div>
        </div>
      </section>

      {/* Nudge */}
      <section className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5 flex gap-4 items-center">
        <div className="bg-[#ff906d]/20 rounded-xl size-11 shrink-0 flex items-center justify-center text-[#ff906d] font-black text-lg">
          i
        </div>
        <div className="flex-1">
          <p className="text-[#f9f5f8] text-sm font-bold">
            Entrená 2 veces más para desbloquear la Pro Grip Mat
          </p>
          <p className="text-[#adaaad] text-xs mt-1">
            Estás más cerca que de costumbre esta semana
          </p>
          <button className="text-[#ff906d] text-xs font-black uppercase tracking-[0.5px] mt-2">
            Ver plan sugerido →
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="bg-[#1f1f22] rounded-full p-1 flex gap-1">
        {(["activity", "goals"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 rounded-full py-2.5 text-xs font-black uppercase tracking-[0.5px]"
            style={
              tab === t
                ? {
                    backgroundImage:
                      "linear-gradient(135deg, rgb(255,120,77) 0%, rgb(255,102,182) 100%)",
                    color: "#0e0e10",
                  }
                : { color: "#adaaad" }
            }
          >
            {t === "activity" ? "Actividad" : "Objetivos"}
          </button>
        ))}
      </div>

      {tab === "goals" ? (
        <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-6 flex flex-col gap-3">
          <p className="text-[#adaaad] text-sm">
            Todavía no configuraste objetivos personales — esta sección se
            completa cuando el gimnasio habilite metas por socio.
          </p>
          <div className="flex flex-col gap-2">
            {[
              { label: "3 check-ins por semana", pct: 66 },
              { label: "5.000 KP este mes", pct: 40 },
            ].map((g) => (
              <div key={g.label} className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#f9f5f8]">{g.label}</span>
                  <span className="text-[#adaaad]">{g.pct}%</span>
                </div>
                <div className="bg-[#262528] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#ff906d] h-full rounded-full"
                    style={{ width: `${g.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* Weekly activity */}
          <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[#f9f5f8] text-sm font-black tracking-[3.2px] uppercase">
                Actividad semanal
              </h2>
              <span className="flex items-center gap-1.5 bg-[#262528] rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[1px] text-[#f9f5f8]">
                <span className="size-1.5 rounded-full bg-[#ff66b6]" />
                Activo
              </span>
            </div>
            <div className="flex items-end justify-between h-32">
              {week.map((day, i) => {
                const heightPx = Math.max(6, Math.round((day.value / maxValue) * 112));
                const isBest = i === bestDayIndex;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 relative">
                    {isBest && (
                      <span className="absolute -top-6 bg-[#262528] text-[#f9f5f8] text-[8px] font-black uppercase px-2 py-1 rounded-md whitespace-nowrap">
                        Mejor día
                      </span>
                    )}
                    <div
                      className="w-3 rounded-full"
                      style={{
                        height: heightPx,
                        backgroundImage:
                          day.value > 20
                            ? "linear-gradient(180deg, rgb(255,120,77) 0%, rgb(255,102,182) 100%)"
                            : undefined,
                        backgroundColor: day.value <= 20 ? "#262528" : undefined,
                      }}
                    />
                    <span className="text-[#adaaad] text-[10px] font-bold">{day.d}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Progress rings */}
          <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex justify-around">
              <div className="flex flex-col items-center gap-2">
                <CircularProgress percent={80} size={56} stroke={5} label="80%" />
                <span className="text-[#adaaad] text-[9px] font-bold uppercase tracking-[1px]">Entrenos</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <CircularProgress percent={75} size={56} stroke={5} label="75%" />
                <span className="text-[#adaaad] text-[9px] font-bold uppercase tracking-[1px]">Calorías</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <CircularProgress percent={92} size={56} stroke={5} label="92%" />
                <span className="text-[#adaaad] text-[9px] font-bold uppercase tracking-[1px]">Constancia</span>
              </div>
            </div>
            <button
              disabled
              className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl py-3.5 flex items-center justify-center gap-2 text-[#f9f5f8] text-xs font-black uppercase tracking-[0.5px] cursor-default"
            >
              <WatchIcon /> Vincular reloj
            </button>
          </section>

          {/* Streak + yield */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex flex-col gap-2">
              <FlameIcon />
              <p className="text-[#f9f5f8] font-black text-xl">12 días</p>
              <p className="text-[#adaaad] text-xs">Racha en construcción</p>
              <p className="text-[#adaaad]/60 text-[10px] italic">
                &quot;El momentum es clave&quot;
              </p>
            </div>
            <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex flex-col gap-2">
              <YieldIcon />
              <p className="text-[#adaaad] text-[9px] font-bold uppercase tracking-[1px]">
                Rendimiento promedio
              </p>
              <p className="text-[#f9f5f8] font-black text-xl">320 KP</p>
              <p className="text-[#adaaad] text-xs">Por intensidad de sesión</p>
            </div>
          </div>

          {/* Power spike */}
          <section className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex gap-3 items-center">
            <img
              src={imgDeadlift.src}
              alt=""
              className="size-14 rounded-xl object-cover shrink-0"
            />
            <div>
              <p className="text-[#f9f5f8] font-bold text-sm">
                Pico de rendimiento detectado
              </p>
              <p className="text-[#adaaad] text-xs mt-1 leading-snug">
                Tu rendimiento sube 15% en las sesiones HIIT de la tarde. Tu
                energía llegó al pico el jueves.
              </p>
            </div>
          </section>

          {/* Key insights */}
          <section className="flex flex-col gap-3">
            <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase">
              Datos clave
            </h2>
            <div className="border-l-2 border-[#ff906d] bg-[#1f1f22] rounded-r-xl pl-4 pr-4 py-3 flex gap-3 items-start">
              <SunIcon />
              <p className="text-[#f9f5f8] text-xs leading-snug">
                Los entrenamientos matutinos te dan{" "}
                <span className="text-[#ff906d] font-bold">
                  15% más puntos de consistencia
                </span>{" "}
                en promedio.
              </p>
            </div>
            <div className="border-l-2 border-[#ff66b6] bg-[#1f1f22] rounded-r-xl pl-4 pr-4 py-3 flex gap-3 items-start">
              <TrendIcon />
              <p className="text-[#f9f5f8] text-xs leading-snug">
                Tu mejor rendimiento aparece después de{" "}
                <span className="text-[#ff66b6] font-bold">
                  rachas de 2 días
                </span>
                . ¡Mantené el ritmo!
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
