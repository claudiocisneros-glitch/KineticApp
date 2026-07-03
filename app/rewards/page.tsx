import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isStaff } from "@/lib/auth/staff";
import { getViewMode } from "@/lib/view-mode";
import RedeemButton from "@/components/RedeemButton";
import BottomNav from "@/components/BottomNav";
import ViewModeToggle from "@/components/ViewModeToggle";
import {
  AiGoalNudge,
  RecommendedForYou,
  FeaturedPerks,
  SmartBundle,
  SponsorsStrip,
} from "@/components/pro/RewardsProExtras";

const imgLogoIcon = "/logo.png";

// Imágenes ilustrativas por recompensa (del mockup de Figma). Son solo para
// dar contexto visual al piloto — no fotos reales de cada beneficio.
// Mapeadas por nombre porque `rewards` viene dinámico desde la base.
const rewardImages: Record<string, string> = {
  "Pase de invitado": "/rewards/guest-pass.png",
  "Clase premium": "/rewards/premium-class.png",
  "10% off próxima cuota": "/rewards/membership-discount.png",
  "Reconocimiento en el gym": "/rewards/gym-recognition.png",
};

export default async function RewardsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: rewards }, { data: balanceRow }, { data: myRedemptions }] =
    await Promise.all([
      supabase
        .from("rewards")
        .select("*")
        .eq("is_active", true)
        .order("cost_points", { ascending: true }),
      supabase
        .from("user_points_balance")
        .select("balance")
        .eq("user_id", user!.id)
        .maybeSingle(),
      supabase.from("redemptions").select("reward_id").eq("user_id", user!.id),
    ]);

  const balance = balanceRow?.balance ?? 0;
  const staff = isStaff(user);
  const showPro = staff && getViewMode() === "pro";

  const redemptionCounts = (myRedemptions ?? []).reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.reward_id] = (acc[r.reward_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const availableCount = (rewards ?? []).filter(
    (r) => balance >= r.cost_points
  ).length;

  const nextReward = (rewards ?? []).find((r) => balance < r.cost_points);
  const nextRewardProgress = nextReward
    ? Math.min(100, Math.round((balance / nextReward.cost_points) * 100))
    : 100;

  return (
    <div className="bg-[#0e0e10] min-h-screen">
      <header className="bg-[#131315] flex items-center justify-between px-6 h-16 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <img src={imgLogoIcon} alt="Kinetic Gym" className="h-7" />
          <h1 className="font-black text-lg text-[#f9f5f8] tracking-[-0.9px] uppercase">
            Recompensas
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {staff && <ViewModeToggle currentMode={getViewMode()} />}
          <div className="border border-[#ff66b6] rounded-full size-8" />
        </div>
      </header>

      {/* Wallet card — diseño exacto de Figma */}
      <section
        className="flex flex-col gap-6 items-center px-8 py-6 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
        style={{
          backgroundImage:
            "linear-gradient(170deg, rgb(255, 120, 77) 0.3%, rgb(255, 102, 182) 94%)",
        }}
      >
        <div className="flex flex-col items-center">
          <p className="text-white/80 text-[10px] font-bold tracking-[1px] uppercase">
            Puntos Kinetic totales
          </p>
          <p className="text-white font-black text-[48px] tracking-[-2.4px] leading-[48px]">
            {balance.toLocaleString()} KP
          </p>
        </div>

        {nextReward && (
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-[17px] w-full">
            <p className="text-black font-bold text-sm">
              {availableCount > 0
                ? `Ya podés canjear ${availableCount} recompensa${
                    availableCount > 1 ? "s" : ""
                  }`
                : "Seguí sumando puntos"}
            </p>
            <p className="text-black/70 text-xs mt-1">
              {(nextReward.cost_points - balance).toLocaleString()} KP para{" "}
              {nextReward.name}
            </p>
            <div className="flex flex-col gap-1.5 pt-2">
              <div className="flex justify-between text-[10px] font-bold text-black">
                <span>
                  Faltan {(nextReward.cost_points - balance).toLocaleString()}{" "}
                  KP
                </span>
                <span>{nextRewardProgress}%</span>
              </div>
              <div className="bg-black/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-black h-full rounded-full"
                  style={{ width: `${nextRewardProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {showPro && (
        <div className="px-5 pt-6">
          <AiGoalNudge />
        </div>
      )}

      <main className="px-5 pt-8 pb-[110px] flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <h2 className="font-bold text-xl text-[#f9f5f8]">Canjear puntos</h2>

          <div className="grid grid-cols-2 gap-4">
            {(rewards ?? []).map((reward) => {
            const alreadyRedeemedCount = redemptionCounts[reward.id] ?? 0;
            const reachedLimit =
              reward.max_redemptions_per_user !== null &&
              alreadyRedeemedCount >= reward.max_redemptions_per_user;
            const progress =
              reward.cost_points === 0
                ? 100
                : Math.min(100, Math.round((balance / reward.cost_points) * 100));
            const affordable = balance >= reward.cost_points;
            const image = rewardImages[reward.name];

            return (
              <div
                key={reward.id}
                className={`bg-[#131315] border rounded-2xl overflow-hidden flex flex-col ${
                  affordable
                    ? "border-[rgba(72,71,74,0.1)]"
                    : "border-[rgba(72,71,74,0.05)] opacity-90"
                }`}
              >
                <div
                  className="h-24 flex items-center justify-center relative"
                  style={
                    image
                      ? undefined
                      : {
                          backgroundImage:
                            "linear-gradient(135deg, rgba(255,120,77,0.25) 0%, rgba(255,102,182,0.25) 100%)",
                        }
                  }
                >
                  {image ? (
                    // Ilustrativa, del mockup de Figma — no es una foto real
                    // del beneficio.
                    <img
                      src={image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#ff906d] font-black text-2xl">
                      {reward.cost_points === 0 ? "★" : "KP"}
                    </span>
                  )}
                  {affordable && (
                    <span className="absolute top-2 left-2 bg-[rgba(38,37,40,0.6)] backdrop-blur-md text-[#ff906d] text-[10px] font-bold px-2 py-1 rounded-lg z-10">
                      Disponible ahora
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-2.5 flex-1">
                  <div>
                    <p className="text-[#f9f5f8] font-bold text-xs">
                      {reward.name}
                    </p>
                    <p className="text-[#adaaad] text-[10px] mt-1 leading-snug">
                      {reward.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 mt-auto">
                    <div className="flex justify-between text-[10px] font-black">
                      <span
                        className={
                          affordable ? "text-[#ff906d]" : "text-[#adaaad]"
                        }
                      >
                        {reward.cost_points.toLocaleString()} KP
                      </span>
                      <span className="text-[#adaaad]">{progress}%</span>
                    </div>
                    <div className="bg-[#262528] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          affordable ? "bg-[#ff906d]" : "bg-[#adaaad]/50"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <RedeemButton
                      rewardId={reward.id}
                      cost={reward.cost_points}
                      disabled={!affordable || reachedLimit}
                      alreadyRedeemed={reachedLimit}
                    />
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {showPro && <RecommendedForYou />}
        {showPro && <FeaturedPerks />}
        {showPro && <SmartBundle />}
        {showPro && <SponsorsStrip />}
      </main>

      <BottomNav />
    </div>
  );
}
