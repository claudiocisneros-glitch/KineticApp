"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Vista socio (5 col, simétrica): Inicio | Retos | [QR] | Recompensas | Logros
// Vista Pro/staff (7 col, simétrica): Inicio | Clases | Retos | [QR] | Recomp | Stats | Logros
// Classes y Stats siguen siendo solo Pro (contenido de muestra sin backend).

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 10 3l7 6.5" />
      <path d="M5 8.5V17h10V8.5" />
    </svg>
  );
}

function RetosIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.2" />
      <circle cx="10" cy="10" r="3.4" />
      <circle cx="10" cy="10" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ClassesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="1.3" y="7.5" width="3" height="5" rx="0.8" />
      <rect x="15.7" y="7.5" width="3" height="5" rx="0.8" />
      <path d="M4.3 10h2.4M13.3 10h2.4" />
      <rect x="6.7" y="6" width="2" height="8" rx="0.6" />
      <rect x="11.3" y="6" width="2" height="8" rx="0.6" />
    </svg>
  );
}

function RewardsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="4.3" />
      <path d="m8.6 6.7 1 1.1 1.9-2.3" />
      <path d="m7 10.8-1.4 5.7L10 14.7l4.4 1.8L13 10.8" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 3h7v3.6a3.5 3.5 0 0 1-7 0V3Z" />
      <path d="M6.5 4.6H4a2 2 0 0 0 2.2 2.3" />
      <path d="M13.5 4.6H16a2 2 0 0 1-2.2 2.3" />
      <path d="M10 10.2v2.6" />
      <path d="M7.3 16.5h5.4l-.6-3.2H7.9z" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.2 15.5 6.5 10l3 3 5.5-6.5" />
      <path d="M11.8 6h3.2v3.2" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="#0e0e10">
      <rect x="2" y="2" width="5.5" height="5.5" rx="1" />
      <rect x="3.6" y="3.6" width="2.3" height="2.3" fill="#ff906d" />
      <rect x="12.5" y="2" width="5.5" height="5.5" rx="1" />
      <rect x="14.1" y="3.6" width="2.3" height="2.3" fill="#ff906d" />
      <rect x="2" y="12.5" width="5.5" height="5.5" rx="1" />
      <rect x="3.6" y="14.1" width="2.3" height="2.3" fill="#ff906d" />
      <rect x="12.5" y="12.5" width="2.3" height="2.3" />
      <rect x="15.8" y="12.5" width="1.7" height="1.7" />
      <rect x="12.5" y="15.8" width="1.7" height="1.7" />
      <rect x="15.4" y="15.4" width="2.1" height="2.1" />
    </svg>
  );
}

export default function BottomNav({ showPro = false }: { showPro?: boolean }) {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    `flex flex-col gap-1 items-center justify-self-center text-[9px] font-bold tracking-[1px] uppercase ${
      active ? "text-[#ff906d]" : "text-[#adaaad]"
    }`;

  const qrButton = (
    <Link
      href="/checkin"
      className="justify-self-center rounded-full p-1 -mt-9 shadow-[0px_10px_15px_-3px_rgba(255,144,109,0.2),0px_4px_6px_-4px_rgba(255,144,109,0.2)] border-4 border-[#0e0e10]"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
      }}
    >
      <span className="flex items-center justify-center size-12">
        <QrIcon />
      </span>
    </Link>
  );

  if (!showPro) {
    return (
      <nav
        className="bg-[#0e0e10] border-t border-[rgba(72,71,74,0.1)] fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 items-center pt-[14px] px-3 w-full max-w-[390px] mx-auto"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <Link href="/" className={linkClass(pathname === "/")}>
          <HomeIcon />
          <span>Inicio</span>
        </Link>
        <Link href="/retos" className={linkClass(pathname === "/retos")}>
          <RetosIcon />
          <span>Retos</span>
        </Link>
        {qrButton}
        <Link href="/rewards" className={linkClass(pathname === "/rewards")}>
          <RewardsIcon />
          <span>Premios</span>
        </Link>
        <Link href="/logros" className={linkClass(pathname === "/logros")}>
          <TrophyIcon />
          <span>Logros</span>
        </Link>
      </nav>
    );
  }

  return (
    <nav
      className="bg-[#0e0e10] border-t border-[rgba(72,71,74,0.1)] fixed bottom-0 left-0 right-0 z-50 grid grid-cols-7 items-center pt-[14px] px-1.5 w-full max-w-[390px] mx-auto"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <Link href="/" className={linkClass(pathname === "/")}>
        <HomeIcon />
        <span>Inicio</span>
      </Link>
      <Link href="/classes" className={linkClass(pathname === "/classes")}>
        <ClassesIcon />
        <span>Clases</span>
      </Link>
      <Link href="/retos" className={linkClass(pathname === "/retos")}>
        <RetosIcon />
        <span>Retos</span>
      </Link>
      {qrButton}
      <Link href="/rewards" className={linkClass(pathname === "/rewards")}>
        <RewardsIcon />
        <span>Premios</span>
      </Link>
      <Link href="/stats" className={linkClass(pathname === "/stats")}>
        <StatsIcon />
        <span>Stats</span>
      </Link>
      <Link href="/logros" className={linkClass(pathname === "/logros")}>
        <TrophyIcon />
        <span>Logros</span>
      </Link>
    </nav>
  );
}
