"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const imgLogoIcon = "/logo.png";
const imgHeroBackground = "/login-hero.png";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  // Social login y alta de cuenta quedaron fuera del alcance del MVP a
  // propósito (ver decisión de scope). El diseño los muestra porque el
  // prototipo original los incluye, pero todavía no están conectados.
  function notImplementedYet() {
    alert(
      "Por ahora, para crear una cuenta o usar login social, contactá al staff del gimnasio."
    );
  }

  return (
    <div className="bg-[#0e0e10] flex flex-col items-center min-h-screen relative">
      {/* Header */}
      <div className="backdrop-blur-[12px] bg-[#040406] flex h-[64px] items-center justify-center px-6 w-full max-w-[390px] fixed top-0 z-10">
        <img src={imgLogoIcon} alt="Kinetic Gym" className="h-7" />
      </div>

      <main className="flex flex-col items-center justify-center overflow-hidden pt-[86px] px-6 relative w-full max-w-[390px] z-[2]">
        {/* Fondo con imagen + gradiente */}
        <div className="absolute inset-0 -z-10">
          <div className="h-full w-full opacity-30 mix-blend-luminosity">
            <img
              src={imgHeroBackground}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-[#0e0e10]/90 via-50% to-transparent" />
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center gap-2 max-w-[448px] pb-10 w-full">
          <h1 className="font-black text-[26px] text-[#f9f5f8] tracking-[-1.8px] text-center leading-[40px] pt-2">
            Bienvenido a Kinetic Gym
          </h1>
          <p className="text-[#adaaad] text-sm tracking-[0.8px] uppercase text-center">
            Entrená. Sumá. Ganá.
          </p>
        </div>

        {/* Card de login */}
        <div className="max-w-[448px] w-full">
          <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.05)] rounded-2xl p-[33px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col gap-6 w-full">
            <form onSubmit={handleLogin} className="flex flex-col gap-6 w-full">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[#adaaad] text-[10px] font-bold tracking-[1px] uppercase">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@energy.com"
                  className="bg-[#131315] border border-[rgba(72,71,74,0.2)] rounded-xl px-[17px] py-[19px] text-base text-[#f9f5f8] placeholder:text-[rgba(118,117,119,0.5)] w-full focus:outline-none focus:border-[#ff906d]"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[#adaaad] text-[10px] font-bold tracking-[1px] uppercase">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={notImplementedYet}
                    className="text-[#adaaad] text-[10px] font-bold tracking-[1px] uppercase"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#131315] border border-[rgba(72,71,74,0.2)] rounded-xl px-[17px] py-[19px] text-base text-[#f9f5f8] placeholder:text-[rgba(118,117,119,0.5)] w-full focus:outline-none focus:border-[#ff906d]"
                />
              </div>

              {error && <p className="text-[#ff66b6] text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center py-4 rounded-xl w-full font-black text-sm text-black uppercase tracking-[0.7px] shadow-[0px_10px_15px_-3px_rgba(255,144,109,0.2),0px_4px_6px_-4px_rgba(255,144,109,0.2)] disabled:opacity-50"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
                }}
              >
                {loading ? "Entrando..." : "Ingresar"}
              </button>
            </form>

            <div className="flex gap-4 items-center pt-2 w-full">
              <div className="bg-[rgba(72,71,74,0.2)] h-px flex-1" />
              <span className="text-[#adaaad] text-[10px] font-bold tracking-[1px] uppercase">
                O continuá con
              </span>
              <div className="bg-[rgba(72,71,74,0.2)] h-px flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={notImplementedYet}
                className="bg-[#262528] border border-[rgba(72,71,74,0.1)] rounded-xl flex items-center justify-center gap-2 py-[15px]"
              >
                <span className="text-[#f9f5f8] text-[10px] font-bold uppercase tracking-[0.5px]">
                  Apple
                </span>
              </button>
              <button
                onClick={notImplementedYet}
                className="bg-[#262528] border border-[rgba(72,71,74,0.1)] rounded-xl flex items-center justify-center gap-2 py-[15px]"
              >
                <span className="text-[#f9f5f8] text-[10px] font-bold uppercase tracking-[0.5px]">
                  Google
                </span>
              </button>
            </div>

            <p className="text-center text-xs pt-2 w-full">
              <span className="text-[#adaaad]">¿No tenés una cuenta? </span>
              <button
                onClick={notImplementedYet}
                className="text-[#ff66b6] font-medium"
              >
                Crear cuenta
              </button>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center opacity-70 pt-7 max-w-[320px]">
          <p className="text-[#adaaad] text-[10px] tracking-[1.6px] uppercase text-center leading-[15px]">
            Cada entrenamiento te acerca a tu próxima recompensa
          </p>
        </div>
      </main>

      <footer className="bg-[#09090b] border-t border-[rgba(72,71,74,0.05)] flex flex-col items-center pb-8 pt-[33px] px-8 w-full max-w-[390px]">
        <p className="text-[#71717a] text-[10px] tracking-[0.8px] uppercase">
          © 2026 Kinetic Gym. Liberá el pulso.
        </p>
      </footer>
    </div>
  );
}
