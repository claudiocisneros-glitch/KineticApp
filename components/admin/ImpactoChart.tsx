"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Snapshot = { date: string; active: number; risk: number };
type Range = "week" | "month" | "6m" | "custom";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";
const ACTIVE_COLOR = "#37d39a";
const RISK_COLOR = "#ff5461";

const RANGE_DAYS: Record<Exclude<Range, "custom">, number> = {
  week: 7,
  month: 30,
  "6m": 182,
};

function fmt(d: string) {
  return new Date(d + "T00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

function CardBig({
  label,
  value,
  delta,
  positiveIsGood,
}: {
  label: string;
  value: number;
  delta: number | null;
  positiveIsGood: boolean;
}) {
  // delta = variación absoluta vs período anterior
  let deltaColor = "#adaaad";
  let deltaText = "sin dato previo";
  if (delta !== null) {
    const good = positiveIsGood ? delta >= 0 : delta <= 0;
    deltaColor = delta === 0 ? "#adaaad" : good ? "#37d39a" : "#ff5461";
    deltaText = `${delta > 0 ? "+" : ""}${delta} vs. período anterior`;
  }
  return (
    <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex flex-col gap-1">
      <p className="text-[#adaaad] text-[10px] font-bold uppercase tracking-[1px]">
        {label}
      </p>
      <p className="text-[#f9f5f8] font-black text-3xl tracking-[-0.5px]">
        {value}
      </p>
      <p className="text-[11px] font-bold" style={{ color: deltaColor }}>
        {deltaText}
      </p>
    </div>
  );
}

export default function ImpactoChart({ snapshots }: { snapshots: Snapshot[] }) {
  const [range, setRange] = useState<Range>("month");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // Filtrado por período seleccionado
  const { rows, prevActiveAvg, prevRiskAvg } = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) =>
      a.date < b.date ? -1 : 1
    );

    if (range === "custom") {
      if (!from || !to) {
        return { rows: sorted, prevActiveAvg: null, prevRiskAvg: null };
      }
      const rows = sorted.filter((s) => s.date >= from && s.date <= to);
      return { rows, prevActiveAvg: null, prevRiskAvg: null };
    }

    const days = RANGE_DAYS[range];
    const today = new Date();
    const start = new Date(today.getTime() - (days - 1) * 86400000)
      .toISOString()
      .slice(0, 10);
    const prevStart = new Date(today.getTime() - (2 * days - 1) * 86400000)
      .toISOString()
      .slice(0, 10);

    const rows = sorted.filter((s) => s.date >= start);
    const prev = sorted.filter((s) => s.date >= prevStart && s.date < start);
    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    return {
      rows,
      prevActiveAvg: avg(prev.map((s) => s.active)),
      prevRiskAvg: avg(prev.map((s) => s.risk)),
    };
  }, [snapshots, range, from, to]);

  const current = rows[rows.length - 1];
  const activeNow = current?.active ?? 0;
  const riskNow = current?.risk ?? 0;
  const activeDelta =
    prevActiveAvg !== null ? activeNow - prevActiveAvg : null;
  const riskDelta = prevRiskAvg !== null ? riskNow - prevRiskAvg : null;

  const chartData = rows.map((s) => ({
    label: fmt(s.date),
    Activos: s.active,
    "En riesgo": s.risk,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Cards grandes con variación */}
      <div className="grid grid-cols-2 gap-3">
        <CardBig
          label="Socios activos"
          value={activeNow}
          delta={activeDelta}
          positiveIsGood
        />
        <CardBig
          label="En riesgo"
          value={riskNow}
          delta={riskDelta}
          positiveIsGood={false}
        />
      </div>

      {/* Selector de período */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            ["week", "Semana"],
            ["month", "Mes"],
            ["6m", "6 meses"],
            ["custom", "Custom"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setRange(k)}
            className="rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.5px]"
            style={
              range === k
                ? { backgroundImage: GRAD, color: "#0e0e10" }
                : { backgroundColor: "#262528", color: "#adaaad" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {range === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-[#1f1f22] border border-[rgba(72,71,74,0.2)] rounded-lg px-3 py-2 text-xs text-[#f9f5f8]"
            style={{ colorScheme: "dark" }}
          />
          <span className="text-[#adaaad] text-xs">a</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="bg-[#1f1f22] border border-[rgba(72,71,74,0.2)] rounded-lg px-3 py-2 text-xs text-[#f9f5f8]"
            style={{ colorScheme: "dark" }}
          />
        </div>
      )}

      {/* Leyenda */}
      <div className="flex gap-4 text-[11px] text-[#adaaad]">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-[3px]"
            style={{ backgroundColor: ACTIVE_COLOR }}
          />
          Activos
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-[3px]"
            style={{ backgroundColor: RISK_COLOR }}
          />
          En riesgo
        </span>
      </div>

      {/* Gráfico */}
      {chartData.length === 0 ? (
        <p className="text-[#adaaad] text-sm text-center py-10">
          No hay datos para este período todavía.
        </p>
      ) : (
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#5e5e67", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                minTickGap={16}
              />
              <YAxis
                tick={{ fill: "#5e5e67", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1b1b1e",
                  border: "1px solid #2a2a30",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#f9f5f8" }}
              />
              <Line
                type="monotone"
                dataKey="Activos"
                stroke={ACTIVE_COLOR}
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="En riesgo"
                stroke={RISK_COLOR}
                strokeWidth={2.5}
                strokeDasharray="5 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
