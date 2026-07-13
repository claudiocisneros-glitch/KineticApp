import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isStaff } from "@/lib/auth/staff";
import { getViewMode } from "@/lib/view-mode";
import BottomNav from "@/components/BottomNav";
import AvatarMenu from "@/components/AvatarMenu";
import StatsView from "@/components/pro/StatsView";

const imgLogoIcon = "/logo.png";

// Igual criterio que /classes: contenido de muestra, gateado a staff +
// vista Pro.
export default async function StatsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const staff = isStaff(user);
  const showPro = staff && getViewMode() === "pro";

  if (!showPro) redirect("/");

  return (
    <div className="bg-[#0e0e10] min-h-screen">
      <header className="bg-[#131315] flex items-center justify-between px-6 h-16 sticky top-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
          <img src={imgLogoIcon} alt="Kinetic Gym" className="h-7 shrink-0" />
          <h1 className="font-black text-lg text-[#f9f5f8] tracking-[-0.9px] uppercase truncate">
            Stats
          </h1>
        </div>
        <AvatarMenu currentMode={getViewMode()} />
      </header>

      <main
        className="px-5 pt-6"
        style={{ paddingBottom: "calc(110px + env(safe-area-inset-bottom))" }}
      >
        <StatsView />
      </main>

      <BottomNav showPro={showPro} />
    </div>
  );
}
