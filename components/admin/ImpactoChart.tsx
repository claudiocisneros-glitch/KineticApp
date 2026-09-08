"use client";

import { useState } from "react";

// Gráfico de evolución (activos vs. en riesgo). Por ahora con datos de
// ejemplo — cuando esté el motor de riesgo + member_risk se reemplazan las
// series por datos reales. SVG puro, sin librerías (no rompe el build).

type Series = { labels: string[]; activos: number[]; riesgo: number[] };

const DATA: Record<"week" | "month", Series> = {
  week: {
    labels: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],
    activos: [118, 121, 126, 129, 133, 136, 139, 142],
    riesgo: [31, 29, 28, 25, 24, 22, 20, 18],
  },
  month: {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    activos: [96, 108, 119, 127, 135, 142],
    riesgo: [40, 37, 33, 28, 23, 18],
  },
};

const W = 340;
const H = 170;
const PAD_L = 28;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 22;

function pointsFor(values: number[], max: number) {
  const n = values.length;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  return values.map((v, i) => {
    const x = PAD_L + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = PAD_T + innerH - (v / max) * innerH;
    return { x, y };
  });
}

export default function ImpactoChart() {
  const [view, setView] = useState<"week" | "month">("week");
  const d = DATA[view];
  const max = Math.ceil(Math.max(...d.activos, ...d.riesgo) / 20) * 20 + 20;

  const act = pointsFor(d.activos, max);
  const rsk = pointsFor(d.riesgo, max);
  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PAD_T + (H - PAD_T - PAD_B) * f,
    val: Math.round(max * (1 - f)),
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {(["week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.5px]"
              style={
                view === v
                  ? {
                      backgroundImage:
                        "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
                      color: "#0e0e10",
                    }
                  : { backgroundColor: "#262528", color: "#adaaad" }
              }
            >
              {v === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
        <div className="flex gap-4 text-[11px] text-[#adaaad]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-[3px] bg-[#37d39a]" />
            Activos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-[3px] bg-[#ff5461]" />
            En riesgo
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Evolución de socios activos y en riesgo (datos de ejemplo)"
      >
        {gridYs.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              y1={g.y}
              x2={W - PAD_R}
              y2={g.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <text x={0} y={g.y + 3} fill="#5e5e67" fontSize="8">
              {g.val}
            </text>
          </g>
        ))}

        {d.labels.map((lbl, i) => {
          const x =
            PAD_L +
            (d.labels.length === 1
              ? (W - PAD_L - PAD_R) / 2
              : (i / (d.labels.length - 1)) * (W - PAD_L - PAD_R));
          return (
            <text
              key={i}
              x={x}
              y={H - 6}
              fill="#5e5e67"
              fontSize="8"
              textAnchor="middle"
            >
              {lbl}
            </text>
          );
        })}

        <path d={toPath(act)} fill="none" stroke="#37d39a" strokeWidth="2.2" strokeLinejoin="round" />
        <path
          d={toPath(rsk)}
          fill="none"
          stroke="#ff5461"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeDasharray="5 4"
        />

        {act.map((p, i) => (
          <circle key={`a${i}`} cx={p.x} cy={p.y} r="2.4" fill="#37d39a" />
        ))}
        {rsk.map((p, i) => (
          <circle key={`r${i}`} cx={p.x} cy={p.y} r="2.4" fill="#ff5461" />
        ))}
      </svg>
    </div>
  );
}
