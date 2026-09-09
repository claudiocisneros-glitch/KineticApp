"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";
const imgLogoIcon = "/logo.png";

export const dynamic = "force-dynamic";

export default function RegistroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    "bg-[#131315] border border-[rgba(72,71,74,0.2)] rounded-xl px-[17px] py-[15px] text-base text-[#f9f5f8] placeholder:text-[rgba(118,117,119,0.5)] w-full focus:outline-none focus:border-[#ff906d]";

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setError("Completá nombre, email y una contraseña de al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (error || !data.user) {
      setLoading(false);
      setError(
        error?.message?.toLowerCase().includes("registered")
          ? "Ese email ya está registrado. Probá iniciar sesión."
          : error?.message ?? "No se pudo crear la cuenta."
      );
      return;
    }

    // Si cargó código de referido, lo vinculamos (server-side).
    if (refCode.trim()) {
      await fetch("/api/registro/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: refCode.trim() }),
      }).catch(() => {});
    }

    router.push("/pendiente");
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="bg-[#0e0e10] min-h-screen flex flex-col items-center px-6 py-10">
      <img src={imgLogoIcon} alt="Kinetic Gym" className="h-7 mb-8" />
      <div className="w-full max-w-[420px]">
        <h1 className="text-[#f9f5f8] font-black text-2xl mb-1">Crear cuenta</h1>
        <p className="text-[#adaaad] text-sm mb-6">
          Registrate y el staff aprueba tu alta cuando te asocies.
        </p>

        <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-6 flex flex-col gap-4">
          <button
            onClick={signInWithGoogle}
            className="bg-[#262528] border border-[rgba(72,71,74,0.2)] rounded-xl py-3.5 text-[#f9f5f8] text-sm font-bold flex items-center justify-center gap-2"
          >
            Continuar con Google
          </button>

          <div className="flex gap-4 items-center">
            <div className="bg-[rgba(72,71,74,0.2)] h-px flex-1" />
            <span className="text-[#adaaad] text-[10px] font-bold tracking-[1px] uppercase">
              o con tu email
            </span>
            <div className="bg-[rgba(72,71,74,0.2)] h-px flex-1" />
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nombre y apellido"
              className={inputCls}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputCls}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className={inputCls}
            />
            <input
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toUpperCase())}
              placeholder="Código de referido (opcional)"
              className={inputCls}
            />
            {error && <p className="text-[#ff66b6] text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl py-4 text-black font-black text-sm uppercase tracking-[0.7px] disabled:opacity-50"
              style={{ backgroundImage: GRAD }}
            >
              {loading ? "Creando..." : "Crear cuenta"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#adaaad] mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-[#ff66b6] font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
