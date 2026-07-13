"use client";

// Todo este archivo es contenido de MUESTRA para mostrar el diseño
// completo del producto (a inversores, al gimnasio, etc.) — no está
// conectado a datos reales ni a sponsors reales. Los botones de acción
// acá son decorativos a propósito, para no sugerir que hacen algo que
// todavía no existe.
// Las fotos son de stock (carpeta imgs/), solo para dar contexto visual.

import { useState } from "react";
import imgYoga from "../../imgs/Img1.png";
import imgSpinning from "../../imgs/Img4.png";

export function AiSearchBar() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#1f1f22] rounded flex items-center px-4 py-4">
        <p className="text-[#adaaad] text-sm flex-1">
          ¿Qué actividades dan más puntos?
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[
          "Clases con más reservas",
          "Actividades con puntos x2",
          "¿Cómo canjeo puntos?",
        ].map((label) => (
          <span
            key={label}
            className="bg-[#19191c] border border-[rgba(72,71,74,0.3)] rounded-full px-4 py-2 text-[10px] font-bold text-[#adaaad] uppercase tracking-[1px] whitespace-nowrap"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function KpiGrid() {
  const stats = [
    { label: "Pasos", value: "8.432" },
    { label: "Kcal", value: "642" },
    { label: "Tiempo", value: "52m" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex flex-col items-center"
        >
          <p className="text-[#adaaad] text-[10px] font-bold uppercase tracking-[1px]">
            {s.label}
          </p>
          <p className="text-[#f9f5f8] font-black text-xl tracking-[-0.5px] pt-1">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// Íconos hechos a mano siguiendo la referencia de Figma (node 1:68) — el
// sandbox no puede descargar los assets exportados de Figma (red
// bloqueada a figma.com), así que se recrean como SVG inline en vez de
// usar el export exacto.
function NutritionIcon() {
  return (
    <svg width="14" height="19" viewBox="0 0 14 19" fill="none">
      <path
        d="M7 1C3.7 1 1 3.7 1 7v5c0 3.3 2.7 6 6 6s6-2.7 6-6V7c0-3.3-2.7-6-6-6Z"
        stroke="#ff906d"
        strokeWidth="1.5"
      />
      <path d="M1 9h12" stroke="#ff906d" strokeWidth="1.5" />
    </svg>
  );
}

function GuestPassIcon() {
  return (
    <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="#ff66b6" strokeWidth="1.5" />
      <path
        d="M2 15c0-3.3 2.7-6 6-6s6 2.7 6 6"
        stroke="#ff66b6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18 3v6M15 6h6"
        stroke="#ff66b6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GearVoucherIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M4 5V3.5a2 2 0 0 1 4 0V5"
        stroke="#ff906d"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <rect
        x="1.5"
        y="5"
        width="13"
        height="9.5"
        rx="1.5"
        stroke="#ff906d"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function PromotionsCarousel() {
  const promos = [
    {
      title: "20% off",
      subtitle: "Packs de nutrición",
      tag: "500 KP",
      note: "Tiempo limitado",
      icon: <NutritionIcon />,
      accent: "255,144,109",
      pillText: "#5b1600",
    },
    {
      title: "Pase de invitado gratis",
      subtitle: null,
      tag: "1200 KP",
      note: "Compartí el esfuerzo",
      icon: <GuestPassIcon />,
      accent: "255,102,182",
      pillText: "#ffffff",
    },
    {
      title: "Voucher de $50 en equipo",
      subtitle: null,
      tag: "2500 KP",
      note: "Socios Platinum",
      icon: <GearVoucherIcon />,
      accent: "255,144,109",
      pillText: "#460f00",
    },
  ];
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase">
          Promociones y descuentos
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {promos.map((p) => (
          <div
            key={p.title}
            className="bg-[#1f1f22] border rounded-2xl p-[21px] min-w-[200px] h-36 shrink-0 flex flex-col justify-between"
            style={{ borderColor: `rgba(${p.accent},0.1)` }}
          >
            <div className="flex items-start justify-between w-full">
              <div
                className="backdrop-blur-md flex items-center justify-center rounded-xl shrink-0 size-10"
                style={{ backgroundColor: `rgba(${p.accent},0.2)` }}
              >
                {p.icon}
              </div>
              <span
                className="rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[-0.5px] shrink-0"
                style={{
                  backgroundColor: `rgba(${p.accent},0.9)`,
                  color: p.pillText,
                }}
              >
                {p.tag}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {p.subtitle ? (
                <p className="text-[#f9f5f8] font-bold leading-tight">
                  <span className="text-[19px]">{p.title}</span>
                  <br />
                  <span className="text-sm">{p.subtitle}</span>
                </p>
              ) : (
                <p className="text-[#f9f5f8] font-bold text-base">
                  {p.title}
                </p>
              )}
              <p className="text-[#adaaad] text-[10px] font-bold uppercase">
                {p.note}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Datos de muestra por métrica — cuando se sume tracking de biometría/GPS
// del gym esto se calcula de check-ins reales (tiempo en zona, pasos,
// calorías estimadas), siempre condicionado a que el usuario esté dentro
// de la cobertura GPS del gimnasio.
const weeklyMetrics = {
  time: {
    label: "Tiempo",
    totalLabel: "Tiempo total esta semana",
    previousTotal: 260,
    days: [
      { d: "L", value: 35 },
      { d: "M", value: 52 },
      { d: "M", value: 40 },
      { d: "J", value: 64 },
      { d: "V", value: 48 },
      { d: "S", value: 20 },
      { d: "D", value: 25 },
    ],
    format: (v: number) => {
      const h = Math.floor(v / 60);
      const m = Math.round(v % 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    },
  },
  calories: {
    label: "Calorías",
    totalLabel: "Calorías totales esta semana",
    previousTotal: 1950,
    days: [
      { d: "L", value: 220 },
      { d: "M", value: 410 },
      { d: "M", value: 290 },
      { d: "J", value: 520 },
      { d: "V", value: 350 },
      { d: "S", value: 140 },
      { d: "D", value: 180 },
    ],
    format: (v: number) => `${Math.round(v).toLocaleString()} kcal`,
  },
} as const;

export function WeeklyActivityChart() {
  const [metric, setMetric] = useState<keyof typeof weeklyMetrics>("time");
  const current = weeklyMetrics[metric];

  const total = current.days.reduce((sum, d) => sum + d.value, 0);
  const delta = ((total - current.previousTotal) / current.previousTotal) * 100;
  const isUp = delta >= 0;
  const avg = total / current.days.length;
  const maxValue = Math.max(...current.days.map((d) => d.value));

  return (
    <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[#f9f5f8] text-sm font-black tracking-[3.2px] uppercase">
          Racha semanal de actividad
        </h2>
        <div className="bg-[#262528] rounded-full p-1 flex gap-1">
          {(Object.keys(weeklyMetrics) as (keyof typeof weeklyMetrics)[]).map(
            (m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.5px] ${
                  metric === m ? "text-black" : "text-[#adaaad]"
                }`}
                style={
                  metric === m
                    ? {
                        backgroundImage:
                          "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
                      }
                    : undefined
                }
              >
                {weeklyMetrics[m].label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[#adaaad] text-[10px] font-bold uppercase tracking-[1px]">
          {current.totalLabel}
        </p>
        <div className="flex items-end gap-2">
          <p className="text-[#f9f5f8] font-black text-[32px] tracking-[-1px] leading-none">
            {current.format(total)}
          </p>
          <span
            className={`text-xs font-black pb-1 ${
              isUp ? "text-[#4ade80]" : "text-[#ff7346]"
            }`}
          >
            {isUp ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
          </span>
        </div>
        <p className="text-[#adaaad]/60 text-[10px]">
          Semana anterior: {current.format(current.previousTotal)}
        </p>
      </div>

      <div className="flex items-end justify-between h-32">
        {current.days.map((day, i) => {
          const heightPx = Math.max(
            8,
            Math.round((day.value / maxValue) * 112)
          );
          const isHigh = day.value > avg;
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div
                className="w-3 rounded-full"
                style={{
                  height: heightPx,
                  backgroundImage: isHigh
                    ? "linear-gradient(180deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)"
                    : undefined,
                  backgroundColor: !isHigh ? "#262528" : undefined,
                }}
              />
              <span className="text-[#adaaad] text-[10px] font-bold">
                {day.d}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function UpcomingActivities() {
  const activities = [
    {
      title: "Spinning Pro",
      time: "Hoy • 18:00",
      color: "text-[#ff7346]",
      image: imgSpinning,
      cta: "Reservar ahora",
    },
    {
      title: "Zen Flow Yoga",
      time: "Mañana • 07:00",
      color: "text-[#ff66b6]",
      image: imgYoga,
      cta: "Reservar",
    },
  ];
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase">
          Próximas actividades
        </h2>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
        {activities.map((a) => (
          <div
            key={a.title}
            className="relative rounded-3xl overflow-hidden w-60 aspect-[4/5] shrink-0 border border-[rgba(72,71,74,0.3)]"
          >
            <img
              src={a.image.src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-3">
              <div>
                <p className={`text-[10px] font-black uppercase ${a.color}`}>
                  {a.time}
                </p>
                <p className="text-white font-black italic text-2xl uppercase tracking-[-1.2px]">
                  {a.title}
                </p>
              </div>
              <button
                disabled
                className="bg-white text-black text-xs font-black uppercase tracking-[1.2px] rounded-xl py-3 cursor-default"
              >
                {a.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SponsorsStrip() {
  return (
    <section className="border-t border-[rgba(72,71,74,0.1)] pt-6 flex flex-col items-center gap-4 opacity-40">
      <p className="text-[#adaaad] text-[10px] font-black tracking-[2px] uppercase">
        Nuestros aliados
      </p>
      <div className="flex gap-8 items-center">
        <span className="text-white font-bold text-lg">Stream</span>
        <span className="text-white font-bold text-lg">Fantellion</span>
        <span className="text-white font-bold text-sm uppercase">
          Ripped
        </span>
      </div>
    </section>
  );
}
