"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PendientePage() {
  const supabase = createClient();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.status === "active") {
        router.replace("/");
        return;
      }
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (checking) {
    return (
      <div className="bg-[#0e0e10] min-h-screen flex items-center justify-center">
        <p className="text-[#adaaad] text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0e0e10] min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm flex flex-col items-center gap-4">
        <div className="size-16 rounded-full bg-[#ff906d]/10 flex items-center justify-center text-3xl">
          ⏳
        </div>
        <h1 className="text-[#f9f5f8] font-black text-2xl">
          Tu solicitud está en revisión
        </h1>
        <p className="text-[#adaaad] text-sm leading-relaxed">
          El staff del gimnasio tiene que aprobar tu alta. Apenas te confirmen,
          vas a poder usar la app. Si ya te asociaste, avisales que revisen las
          solicitudes.
        </p>
        <button
          onClick={() => router.refresh()}
          className="rounded-xl py-3 px-6 text-black font-black text-sm uppercase tracking-[0.5px] mt-2"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
          }}
        >
          Ya me aprobaron
        </button>
        <button
          onClick={logout}
          className="text-[#adaaad] text-xs font-bold uppercase tracking-[0.5px] mt-1"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
