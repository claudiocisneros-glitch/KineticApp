// Mismo criterio que components/pro/HomeProExtras.tsx: contenido de
// muestra, sin conexión a sponsors reales, botones decorativos.
// Las fotos son de stock (carpeta imgs/), solo para dar contexto visual.

import imgAbWorkout from "../../imgs/Img3.png";
import imgDeadlift from "../../imgs/Img2.png";
import imgCombo from "../../imgs/Gemini_Generated_Image_vba6l5vba6l5vba6.png";

export function AiGoalNudge() {
  return (
    <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5 flex gap-4 items-center">
      <div className="bg-[#ff906d]/20 rounded-full size-12 shrink-0 flex items-center justify-center text-[#ff906d] font-black">
        i
      </div>
      <div className="flex-1">
        <p className="text-[#f9f5f8] text-sm">
          Entrená 2 veces más esta semana para desbloquear la Pro Grip Mat
        </p>
        <div className="flex items-center gap-3 pt-3">
          <div className="bg-[#262528] h-2 rounded-full flex-1 overflow-hidden">
            <div className="bg-[#ff784d] h-full w-1/3 rounded-full" />
          </div>
          <span className="text-[#adaaad] text-[10px] font-bold">
            1/3 sesiones
          </span>
        </div>
      </div>
    </div>
  );
}

export function RecommendedForYou() {
  const products = [
    {
      name: "Bálsamo de Recuperación Pro",
      cost: "1.800 KP",
      image: imgAbWorkout,
    },
    {
      name: "Shaker de Rendimiento Steel",
      cost: "2.500 KP",
      image: imgCombo,
    },
  ];
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl text-[#f9f5f8]">
            Recomendado para vos
          </h2>
          <p className="text-[#adaaad] text-xs">Basado en tus entrenamientos</p>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {products.map((p) => (
          <div
            key={p.name}
            className="bg-[#131315] rounded-2xl overflow-hidden w-64 shrink-0"
          >
            <div className="h-32 w-full relative">
              <img
                src={p.image.src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="p-4 flex flex-col gap-2">
              <p className="text-[#f9f5f8] font-bold text-sm">{p.name}</p>
              <p className="text-[#ff784d] font-black text-xs">{p.cost}</p>
              <button
                disabled
                className="rounded-xl py-2.5 text-white text-sm font-bold cursor-default mt-1"
                style={{
                  backgroundImage:
                    "linear-gradient(165deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
                }}
              >
                Canjear
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeaturedPerks() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl text-[#f9f5f8]">Beneficios destacados</h2>
      </div>
      <div className="relative rounded-3xl overflow-hidden h-64">
        <img
          src={imgDeadlift.src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-[#ff906d] text-black text-[10px] font-black uppercase px-3 py-1 rounded-full">
            Recompensa limitada
          </span>
          <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full">
            Termina en 2h
          </span>
        </div>
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div>
            <p className="text-white font-black text-2xl tracking-[-0.6px] leading-tight">
              Pase Masterclass:
              <br />
              Powerlifting de Élite
            </p>
            <p className="text-[#ff784d] font-black text-base pt-1">
              3.000 KP
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SmartBundle() {
  return (
    <section className="bg-[#1f1f22] border border-white/5 rounded-3xl p-6 flex flex-col gap-6 relative">
      <span className="absolute top-4 right-4 bg-[#b60077] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">
        Ahorrá 15%
      </span>
      <h2 className="text-[#f9f5f8] font-bold text-lg">
        Combo Inteligente de Rendimiento
      </h2>
      <div>
        <p className="text-[#f9f5f8] text-sm font-bold">Kit de Proteína + Shaker</p>
        <p className="text-[#adaaad] text-xs mt-1">
          El combo definitivo post-entrenamiento para una recuperación óptima.
        </p>
      </div>
      <button
        disabled
        className="rounded-xl py-4 text-white text-sm font-bold cursor-default"
        style={{
          backgroundImage:
            "linear-gradient(165deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
        }}
      >
        Canjear combo — 8.500 KP
      </button>
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
