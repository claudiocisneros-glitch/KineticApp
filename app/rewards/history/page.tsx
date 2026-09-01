import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { isStaff } from "@/lib/auth/staff";
import { getViewMode } from "@/lib/view-mode";

const imgLogoIcon = "/logo.png";

export default async function RewardsHistoryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: redemptions } = await supabase
    .from("redemptions")
    .select("*, rewards(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const staff = await isStaff(user);
  const showPro = staff && getViewMode() === "pro";

  return (
    <div className="bg-[#0e0e10] min-h-screen">
      <header className="bg-[#131315] flex items-center gap-4 px-6 h-16 sticky top-0 z-30">
        <Link href="/rewards" className="text-[#adaaad] text-xs font-bold uppercase tracking-[0.5px]">
          ← Volver
        </Link>
        <img src={imgLogoIcon} alt="Kinetic Gym" className="h-7 shrink-0" />
        <h1 className="font-black text-lg text-[#f9f5f8] tracking-[-0.9px] uppercase truncate">
          Mis canjes
        </h1>
      </header>

      <main
        className="px-5 pt-6 flex flex-col gap-3"
        style={{ paddingBottom: "calc(110px + env(safe-area-inset-bottom))" }}
      >
        {(redemptions ?? []).length === 0 && (
          <p className="text-[#adaaad] text-sm text-center pt-10">
            Todavía no canjeaste ninguna recompensa.
          </p>
        )}

        {(redemptions ?? []).map((r: any) => (
          <div
            key={r.id}
            className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-[#f9f5f8] font-bold text-sm truncate">
                {r.rewards?.name ?? "—"}
              </p>
              <p className="text-[#adaaad] text-xs mt-1">
                {new Date(r.created_at).toLocaleDateString("es-AR")} ·{" "}
                {r.points_spent} KP
              </p>
              <p className="text-white font-black text-base tracking-[2px] mt-2">
                {r.code}
              </p>
            </div>
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded-full shrink-0 ${
                r.status === "fulfilled"
                  ? "bg-[#ff906d]/10 text-[#ff906d]"
                  : "bg-white/5 text-[#adaaad]"
              }`}
            >
              {r.status === "fulfilled" ? "Entregado" : "Pendiente"}
            </span>
          </div>
        ))}
      </main>

      <BottomNav showPro={showPro} />
    </div>
  );
}
