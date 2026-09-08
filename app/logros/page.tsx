import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isStaff } from "@/lib/auth/staff";
import { getViewMode } from "@/lib/view-mode";
import BottomNav from "@/components/BottomNav";
import AvatarMenu from "@/components/AvatarMenu";
import AvatarGlyph from "@/components/AvatarGlyph";

const imgLogoIcon = "/logo.png";

export default async function LogrosPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const staff = await isStaff(user);
  const showPro = staff && getViewMode() === "pro";

  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("badge_id, earned_at, badges(name, description, icon_url)")
    .eq("user_id", user!.id)
    .order("earned_at", { ascending: false });

  const badges = userBadges ?? [];

  return (
    <div className="bg-[#0e0e10] min-h-screen">
      <header className="bg-[#131315] flex items-center justify-between px-6 h-16 sticky top-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
          <img src={imgLogoIcon} alt="Kinetic Gym" className="h-7 shrink-0" />
          <h1 className="font-black text-lg text-[#f9f5f8] tracking-[-0.9px] uppercase truncate">
            Logros
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {staff ? <AvatarMenu currentMode={getViewMode()} /> : <AvatarGlyph />}
        </div>
      </header>

      <main
        className="px-5 pt-6"
        style={{ paddingBottom: "calc(110px + env(safe-area-inset-bottom))" }}
      >
        {badges.length === 0 ? (
          <div className="text-center py-14 px-6">
            <p className="text-[#f9f5f8] font-black text-base">
              Todavía no tenés logros
            </p>
            <p className="text-[#adaaad] text-sm mt-2 max-w-[280px] mx-auto leading-relaxed">
              Empezá a entrenar y sumar check-ins — los logros se desbloquean
              solos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {badges.map((ub: any) => {
              const iconUrl: string | null = ub.badges.icon_url;
              return (
                <div
                  key={ub.badge_id}
                  className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex flex-col gap-3"
                >
                  {iconUrl ? (
                    <img src={iconUrl} alt="" className="size-14" />
                  ) : (
                    <div className="size-14 rounded-full bg-[#ff906d]/10 flex items-center justify-center text-[#ff906d] font-black">
                      ★
                    </div>
                  )}
                  <div>
                    <p className="text-[#f9f5f8] font-bold text-sm">
                      {ub.badges.name}
                    </p>
                    <p className="text-[#adaaad] text-xs mt-1">
                      {ub.badges.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav showPro={showPro} />
    </div>
  );
}
