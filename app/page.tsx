import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isStaff } from "@/lib/auth/staff";
import { getViewMode } from "@/lib/view-mode";
import BottomNav from "@/components/BottomNav";
import AvatarMenu from "@/components/AvatarMenu";
import {
  AiSearchBar,
  KpiGrid,
  PromotionsCarousel,
  WeeklyActivityChart,
  UpcomingActivities,
  SponsorsStrip,
} from "@/components/pro/HomeProExtras";

const imgLogoIcon = "/logo.png";
const imgBellIcon = "/bell-icon.png";
const imgQrCodeIcon = "/qr-icon.png";

export default async function HomePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: balanceRow }, { data: userBadges }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user!.id).single(),
      supabase
        .from("user_points_balance")
        .select("balance")
        .eq("user_id", user!.id)
        .maybeSingle(),
      supabase
        .from("user_badges")
        .select("badge_id, badges(name, description)")
        .eq("user_id", user!.id),
    ]);

  const balance = balanceRow?.balance ?? 0;
  const staff = isStaff(user);
  const showPro = staff && getViewMode() === "pro";

  return (
    <div className="bg-[#0e0e10] min-h-screen">
      {/* Header */}
      <header className="bg-[#131315] flex items-center justify-between px-6 py-4 sticky top-0 z-30">
        <img src={imgLogoIcon} alt="Kinetic Gym" className="h-7 shrink-0" />
        <div className="flex items-center gap-3 shrink-0">
          <img src={imgBellIcon} alt="Notificaciones" className="size-9" />
          {staff && <AvatarMenu currentMode={getViewMode()} />}
        </div>
      </header>

      <main
        className="flex flex-col gap-[22px] px-6 pt-1"
        style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}
      >
        {/* Bienvenida */}
        <div className="flex gap-3 items-center pt-2">
          <div className="border border-[#ff66b6] rounded-full size-8 shrink-0" />
          <h1 className="font-bold text-[22px] text-[#f9f5f8] tracking-[-0.4px]">
            Bienvenido, {profile?.full_name ?? "Socio Kinetic"}
          </h1>
        </div>

        {showPro && <AiSearchBar />}

        {/* Wallet hero — diseño exacto de Figma */}
        <section
          className="rounded-[24px] p-8 shadow-[0px_8px_32px_0px_rgba(255,120,77,0.2)] relative overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
          }}
        >
          <div className="flex flex-col items-center text-center relative z-10">
            <p className="text-white/80 text-[10px] font-black tracking-[3.2px] uppercase">
              Puntos Kinetic totales
            </p>
            <p className="text-white font-black text-[50px] tracking-[-3px] pt-4 leading-[60px]">
              {balance.toLocaleString()} KP
            </p>
            <Link
              href="/rewards"
              className="bg-black text-white rounded-xl px-8 py-4 font-bold text-base tracking-[-0.4px] mt-4 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
            >
              Ver recompensas disponibles
            </Link>
          </div>
        </section>

        {showPro && <KpiGrid />}
        {showPro && <PromotionsCarousel />}

        {/* Racha actual — versión simplificada del "Weekly Activity Streak"
            de Figma (ver WeeklyActivityChart en Pro para la versión completa
            con datos de muestra). El original es un gráfico de barras de
            asistencia por día de la semana con datos que hoy no tenemos
            (requeriría trackear check-ins por día, no solo el contador
            semanal). Se deja marcado para sumar cuando resolvamos el
            cálculo real de racha (primer pendiente del roadmap). */}
        {!showPro && (
          <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-[25px] flex items-center justify-between">
            <p className="text-[#f9f5f8] text-sm font-black tracking-[3.2px] uppercase">
              Racha actual
            </p>
            <p className="text-[#ff7346] font-black text-2xl">
              {profile?.current_streak_weeks ?? 0} semanas
            </p>
          </section>
        )}
        {showPro && <WeeklyActivityChart />}

        {/* Logros */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase">
            Tus logros
          </h2>
          {(userBadges ?? []).length === 0 ? (
            <p className="text-[#adaaad]/60 text-sm">
              Todavía no desbloqueaste ningún logro — ¡arrancá con tu primer
              check-in!
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(userBadges ?? []).map((ub: any) => (
                <div
                  key={ub.badge_id}
                  className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4"
                >
                  <p className="text-[#f9f5f8] font-bold text-sm">
                    {ub.badges.name}
                  </p>
                  <p className="text-[#adaaad] text-xs mt-1">
                    {ub.badges.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {showPro && <UpcomingActivities />}

        {/* Boost your points — diseño exacto de Figma, apunta al check-in real */}
        <section
          className="bg-[#131315] border border-[rgba(255,144,109,0.2)] rounded-[24px] flex flex-col gap-6 items-center px-8 pt-[57px] pb-8 relative overflow-hidden"
        >
          <img
            src={imgQrCodeIcon}
            alt=""
            className="absolute size-24 -top-1 left-1/2 -translate-x-1/2 opacity-90"
          />
          <div className="flex flex-col items-center gap-2 relative z-10">
            <h3 className="text-[#f9f5f8] font-black italic text-xl uppercase tracking-[-1px] text-center">
              Sumá más puntos
            </h3>
            <p className="text-[#adaaad] text-sm text-center max-w-[320px] leading-[22.75px]">
              ¡No te olvides de hacer check-in! Escaneá el QR del gimnasio
              para registrar esta sesión y sumar puntos.
            </p>
          </div>
          <Link
            href="/checkin"
            className="rounded-2xl py-4 w-full text-center font-black text-sm text-black uppercase tracking-[1.4px] shadow-[0px_4px_12px_rgba(255,120,77,0.3)] relative z-10"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
            }}
          >
            Mostrame cómo
          </Link>
        </section>

        {showPro && <SponsorsStrip />}
      </main>

      <BottomNav />
    </div>
  );
}
