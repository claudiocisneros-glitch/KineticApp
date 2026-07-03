// Todo este archivo es contenido de MUESTRA para mostrar el diseño
// completo del producto (a inversores, al gimnasio, etc.) — no está
// conectado a datos reales ni a sponsors reales. Los botones de acción
// acá son decorativos a propósito, para no sugerir que hacen algo que
// todavía no existe.
// Las fotos son de stock (carpeta imgs/), solo para dar contexto visual.

import imgYoga from "../../imgs/Img1.png";
import imgSpinning from "../../imgs/Img4.png";

function ProBadge() {
  return (
    <span className="bg-[#ff906d]/10 text-[#ff906d] text-[9px] font-black uppercase tracking-[1px] px-2 py-1 rounded-full border border-[#ff906d]/20">
      Vista de muestra
    </span>
  );
}

export function AiSearchBar() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#1f1f22] rounded flex items-center px-4 py-4">
        <p className="text-[#adaaad] text-sm flex-1">
          ¿Qué actividades dan más puntos?
        </p>
        <ProBadge />
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

export function PromotionsCarousel() {
  const promos = [
    { title: "20% off en packs de nutrición", tag: "500 KP", note: "Tiempo limitado" },
    { title: "Pase de invitado gratis", tag: "1200 KP", note: "Compartí el esfuerzo" },
    { title: "Voucher de $50 en equipo", tag: "2500 KP", note: "Socios Platinum" },
  ];
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase">
          Promociones y descuentos
        </h2>
        <ProBadge />
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {promos.map((p) => (
          <div
            key={p.title}
            className="bg-[#1f1f22] border border-[rgba(255,144,109,0.1)] rounded-2xl p-5 min-w-[200px] shrink-0"
          >
            <p className="text-[#f9f5f8] font-bold text-base">{p.title}</p>
            <p className="text-[#ff906d] font-black text-xs mt-2">{p.tag}</p>
            <p className="text-[#adaaad] text-[10px] uppercase mt-1">
              {p.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WeeklyActivityChart() {
  // Alturas de muestra, no vienen de datos reales de asistencia por día
  const days = [
    { d: "L", h: 40 },
    { d: "M", h: 96 },
    { d: "M", h: 64 },
    { d: "J", h: 112 },
    { d: "V", h: 80 },
    { d: "S", h: 32 },
    { d: "D", h: 40 },
  ];
  return (
    <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[#f9f5f8] text-sm font-black tracking-[3.2px] uppercase">
          Racha semanal de actividad
        </h2>
        <ProBadge />
      </div>
      <div className="flex items-end justify-between h-32">
        {days.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <div
              className="w-3 rounded-full"
              style={{
                height: day.h,
                backgroundImage:
                  day.h > 48
                    ? "linear-gradient(180deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)"
                    : undefined,
                backgroundColor: day.h <= 48 ? "#262528" : undefined,
              }}
            />
            <span className="text-[#adaaad] text-[10px] font-bold">
              {day.d}
            </span>
          </div>
        ))}
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
        <ProBadge />
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
