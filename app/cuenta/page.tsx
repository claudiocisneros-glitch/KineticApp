"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";

export default function CuentaPage() {
  const supabase = createClient();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (pw.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (pw !== pw2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) {
      setError("No se pudo cambiar la contraseña. Probá de nuevo.");
      return;
    }
    setOk(true);
    setPw("");
    setPw2("");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const inputCls =
    "bg-[#131315] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-3 text-base text-[#f9f5f8] placeholder:text-[#adaaad] w-full focus:outline-none focus:border-[#ff906d]";

  return (
    <div className="bg-[#0e0e10] min-h-screen">
      <header className="bg-[#131315] flex items-center justify-between px-6 h-16 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-[#adaaad] text-xs font-bold uppercase tracking-[0.5px]"
          >
            ← Inicio
          </Link>
          <h1 className="font-black text-lg text-[#f9f5f8] tracking-[-0.9px] uppercase">
            Mi cuenta
          </h1>
        </div>
      </header>

      <main className="px-6 pt-6 flex flex-col gap-6 max-w-md mx-auto">
        <section className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
          <h2 className="text-[#f9f5f8] font-bold text-sm mb-3">
            Cambiar contraseña
          </h2>
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Nueva contraseña"
              className={inputCls}
            />
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Repetir contraseña"
              className={inputCls}
            />
            {error && <p className="text-[#ff66b6] text-sm">{error}</p>}
            {ok && (
              <p className="text-[#37d39a] text-sm">
                ¡Listo! Tu contraseña se cambió.
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl py-3 text-black font-black text-sm uppercase tracking-[0.5px] disabled:opacity-50"
              style={{ backgroundImage: GRAD }}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </form>
        </section>

        <button
          onClick={handleLogout}
          className="text-[#adaaad] text-sm font-bold uppercase tracking-[0.5px] border border-[rgba(72,71,74,0.3)] rounded-xl py-3"
        >
          Cerrar sesión
        </button>
      </main>
    </div>
  );
}
