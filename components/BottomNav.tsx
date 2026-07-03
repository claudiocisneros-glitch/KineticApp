"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// El diseño original de Figma tiene 5 ítems (Home, Classes, QR, Rewards,
// Stats). Classes y Stats no están en el alcance del MVP (booking de
// clases e insights quedaron para Fase 1/4 del roadmap), así que no se
// muestran acá — mostrar un link a algo que no existe genera más
// confusión que valor.
export default function BottomNav() {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    `flex flex-col gap-1 items-center text-[10px] font-bold tracking-[1px] uppercase ${
      active ? "text-[#ff906d]" : "text-[#adaaad]"
    }`;

  return (
    <nav
      className="backdrop-blur-[12px] bg-[rgba(14,14,16,0.95)] border-t border-[rgba(72,71,74,0.1)] fixed bottom-0 left-0 right-0 z-50 grid grid-cols-3 items-center pt-[17px] px-6 w-full max-w-[390px] mx-auto"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <Link
        href="/"
        className={`${linkClass(pathname === "/")} justify-self-start`}
      >
        <span>Inicio</span>
      </Link>

      <Link
        href="/checkin"
        className="justify-self-center rounded-full p-1 -mt-9 shadow-[0px_10px_15px_-3px_rgba(255,144,109,0.2),0px_4px_6px_-4px_rgba(255,144,109,0.2)] border-4 border-[#0e0e10]"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
        }}
      >
        <span className="flex items-center justify-center size-12 text-black text-[10px] font-black">
          QR
        </span>
      </Link>

      <Link
        href="/rewards"
        className={`${linkClass(pathname === "/rewards")} justify-self-end`}
      >
        <span>Recompensas</span>
      </Link>
    </nav>
  );
}
