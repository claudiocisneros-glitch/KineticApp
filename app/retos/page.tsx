import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isStaff } from "@/lib/auth/staff";
import { getViewMode } from "@/lib/view-mode";
import { buildReto60Status, RETO60 } from "@/lib/reto60";
import BottomNav from "@/components/BottomNav";
import AvatarMenu from "@/components/AvatarMenu";
import AvatarGlyph from "@/components/AvatarGlyph";
import RetosView, { type ChallengeView } from "@/components/RetosView";

const imgLogoIcon = "/logo.png";

export default async function RetosPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const staff = await isStaff(user);
  const showPro = staff && getViewMode() === "pro";

  // ---- Estado del Reto 60 (derivado de checkins + primer check-in) ----
  const { data: firstCheckin } = await supabase
    .from("checkins")
    .select("checkin_date")
    .eq("user_id", user!.id)
    .order("checkin_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  let reto60Status = buildReto60Status(null, 0);
  if (firstCheckin) {
    const firstMs = new Date(firstCheckin.checkin_date + "T00:00").getTime();
    const windowEndStr = new Date(firstMs + RETO60.windowDays * 86400000)
      .toISOString()
      .slice(0, 10);
    const { count } = await supabase
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .gte("checkin_date", firstCheckin.checkin_date)
      .lt("checkin_date", windowEndStr);
    reto60Status = buildReto60Status(new Date(firstMs), count ?? 0);
  }

  const { data: prize } = await supabase
    .from("rewards")
    .select("name")
    .eq("reward_trigger", "reto_60")
    .maybeSingle();

  const challenges: ChallengeView[] = [
    {
      id: "reto60",
      name: "Reto 60",
      status: reto60Status,
      milestones: RETO60.milestones,
      prizeName: prize?.name ?? null,
      badgeIcon: "/badges/reto-60.svg",
    },
  ];

  return (
    <div className="bg-[#0e0e10] min-h-screen">
      <header className="bg-[#131315] flex items-center justify-between px-6 h-16 sticky top-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
          <img src={imgLogoIcon} alt="Kinetic Gym" className="h-7 shrink-0" />
          <h1 className="font-black text-lg text-[#f9f5f8] tracking-[-0.9px] uppercase truncate">
            Retos
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {staff ? <AvatarMenu currentMode={getViewMode()} /> : <AvatarGlyph />}
        </div>
      </header>

      <main
        className="px-5 pt-6 flex flex-col gap-6"
        style={{ paddingBottom: "calc(110px + env(safe-area-inset-bottom))" }}
      >
        <RetosView challenges={challenges} />
      </main>

      <BottomNav showPro={showPro} />
    </div>
  );
}
