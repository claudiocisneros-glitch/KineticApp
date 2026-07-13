"use client";

// Contenido de MUESTRA (igual criterio que el resto de la vista Pro): el
// diseño completo de Figma para la sección Clases, sin booking real
// todavía — "RESERVAR" es decorativo a propósito. El filtro Popular/Puntos
// altos sí reordena la lista de muestra, para que se sienta interactivo.

import { useState } from "react";
import imgYoga from "../../imgs/Img1.png";
import imgDeadlift from "../../imgs/Img2.png";
import imgAbWorkout from "../../imgs/Img3.png";
import imgSpinning from "../../imgs/Img4.png";
import imgCombo from "../../imgs/Gemini_Generated_Image_vba6l5vba6l5vba6.png";

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#ff906d" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5c.4 2.6 1.4 3.6 4 4-2.6.4-3.6 1.4-4 4-.4-2.6-1.4-3.6-4-4 2.6-.4 3.6-1.4 4-4Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="5.5" />
      <path d="M7 4v3l2 1.3" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 13S2.5 8.8 2.5 5.5a4.5 4.5 0 0 1 9 0C11.5 8.8 7 13 7 13Z" />
      <circle cx="7" cy="5.5" r="1.6" />
    </svg>
  );
}

const classes = [
  {
    name: "Flow State Yoga",
    kp: 80,
    detail: "60 MIN • Principiantes",
    start: "8:00 AM",
    image: imgYoga,
  },
  {
    name: "Power Hour",
    kp: 120,
    detail: "50 MIN • Alta intensidad",
    start: "12:30 PM",
    image: imgDeadlift,
  },
  {
    name: "Core Sculpt",
    kp: 95,
    detail: "30 MIN • Zona objetivo",
    start: "5:15 PM",
    image: imgAbWorkout,
  },
  {
    name: "Neon Cycle",
    kp: 110,
    detail: "45 MIN • Resistencia",
    start: "6:30 PM",
    image: imgSpinning,
  },
];

export default function ClassesView() {
  const [filter, setFilter] = useState<"popular" | "points">("popular");

  const sortedClasses =
    filter === "points"
      ? [...classes].sort((a, b) => b.kp - a.kp)
      : classes;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[#f9f5f8] font-black text-3xl tracking-[-1px]">
          Clases
        </h1>
        <p className="text-[#adaaad] text-sm mt-1">Ganá puntos por asistir</p>
      </div>

      <div className="bg-[#1f1f22] rounded-2xl flex items-center px-4 py-4 gap-3">
        <p className="text-[#adaaad] text-sm flex-1">
          ¿Qué actividades dan más puntos?
        </p>
        <div className="bg-[#ff906d]/10 border border-[#ff906d]/20 rounded-lg size-8 flex items-center justify-center shrink-0">
          <SparkleIcon />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter("popular")}
          className="rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[1px]"
          style={
            filter === "popular"
              ? {
                  backgroundImage:
                    "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
                  color: "#0e0e10",
                }
              : { backgroundColor: "#262528", color: "#adaaad" }
          }
        >
          Popular
        </button>
        <button
          onClick={() => setFilter("points")}
          className="rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[1px]"
          style={
            filter === "points"
              ? {
                  backgroundImage:
                    "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
                  color: "#0e0e10",
                }
              : { backgroundColor: "#262528", color: "#adaaad" }
          }
        >
          Puntos altos
        </button>
      </div>

      {/* Destacada */}
      <div className="relative rounded-3xl overflow-hidden h-56">
        <img
          src={imgCombo.src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-3">
          <div>
            <p className="text-white font-black text-2xl tracking-[-0.6px]">
              Metabolic Blast
            </p>
            <div className="flex items-center gap-3 text-white/70 text-xs mt-1">
              <span className="flex items-center gap-1">
                <ClockIcon /> 45 MIN
              </span>
              <span className="flex items-center gap-1">
                <PinIcon /> Kinetic Downtown
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-black/50 backdrop-blur-md rounded-xl px-4 py-2">
              <p className="text-[#adaaad] text-[9px] font-bold uppercase tracking-[1px]">
                Recompensa
              </p>
              <p className="text-[#ff906d] font-black text-sm">+150 KP</p>
            </div>
            <button
              disabled
              className="flex-1 rounded-xl py-3 text-black text-xs font-black uppercase tracking-[1px] cursor-default"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
              }}
            >
              Reservar ahora
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-1.5 -mt-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`rounded-full ${
              i === 1 ? "size-1.5 bg-[#ff906d]" : "size-1.5 bg-[#3a393c]"
            }`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {sortedClasses.map((c) => (
          <div
            key={c.name}
            className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-3 flex items-center gap-3"
          >
            <img
              src={c.image.src}
              alt=""
              className="size-16 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[#f9f5f8] font-bold text-sm truncate">
                  {c.name}
                </p>
                <span className="text-[#ff906d] font-black text-xs shrink-0">
                  +{c.kp} KP
                </span>
              </div>
              <p className="text-[#adaaad] text-[10px] mt-0.5">{c.detail}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[#adaaad]/70 text-[10px]">
                  Arranca {c.start}
                </span>
                <button
                  disabled
                  className="bg-[#262528] text-[#f9f5f8] text-[10px] font-black uppercase tracking-[0.5px] rounded-lg px-3 py-1.5 cursor-default"
                >
                  Reservar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
