import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffRole } from "@/lib/auth/staff";
import AdjustPointsForm from "@/components/admin/AdjustPointsForm";
import EditNameForm from "@/components/admin/EditNameForm";

const REASON_LABELS: Record<string, string> = {
  checkin: "Check-in",
  redemption: "Canje",
  adjustment: "Ajuste manual",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  if (!sessionUser) redirect("/login");
  const role = await getStaffRole(sessionUser);
  if (!role) redirect("/");

  const admin = createAdminClient();

  const [
    { data: profile },
    { data: authUser },
    { data: balanceRow },
    { data: ledger },
    { data: checkins },
    { count: checkinsCount },
    { data: redemptions },
    { data: userBadges },
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", params.id).maybeSingle(),
    admin.auth.admin.getUserById(params.id),
    admin
      .from("user_points_balance")
      .select("balance")
      .eq("user_id", params.id)
      .maybeSingle(),
    admin
      .from("points_ledger")
      .select("*")
      .eq("user_id", params.id)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("checkins")
      .select("checkin_date, points_awarded")
      .eq("user_id", params.id)
      .order("checkin_date", { ascending: false })
      .limit(15),
    admin
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", params.id),
    admin
      .from("redemptions")
      .select("*, rewards(name)")
      .eq("user_id", params.id)
      .order("created_at", { ascending: false }),
    admin
      .from("user_badges")
      .select("earned_at, badges(name, description)")
      .eq("user_id", params.id),
  ]);

  if (!profile) notFound();

  const balance = balanceRow?.balance ?? 0;
  const email = authUser?.user?.email ?? "—";

  return (
    <div className="pt-2 flex flex-col gap-6">
      <div>
        <Link
          href="/admin/users"
          className="text-[#adaaad] text-xs font-bold uppercase tracking-[0.5px]"
        >
          ← Socios
        </Link>
        <h1 className="text-2xl text-[#f9f5f8] font-black mt-2">
          {profile.full_name ?? "Sin nombre"}
        </h1>
        <p className="text-[#adaaad] text-sm mt-1">{email}</p>
        {role === "owner" && (
          <EditNameForm userId={params.id} initialName={profile.full_name ?? ""} />
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4">
          <p className="text-[#adaaad] text-[10px] font-bold uppercase tracking-[1px]">
            Balance
          </p>
          <p className="text-[#ff906d] font-black text-xl">
            {balance.toLocaleString()} KP
          </p>
        </div>
        <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4">
          <p className="text-[#adaaad] text-[10px] font-bold uppercase tracking-[1px]">
            Racha actual
          </p>
          <p className="text-[#f9f5f8] font-black text-xl">
            {profile.current_streak_weeks} sem.
          </p>
        </div>
        <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4">
          <p className="text-[#adaaad] text-[10px] font-bold uppercase tracking-[1px]">
            Total check-ins
          </p>
          <p className="text-[#f9f5f8] font-black text-xl">
            {checkinsCount ?? 0}
          </p>
        </div>
        <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4">
          <p className="text-[#adaaad] text-[10px] font-bold uppercase tracking-[1px]">
            Socio desde
          </p>
          <p className="text-[#f9f5f8] font-black text-sm pt-1.5">
            {new Date(profile.member_since).toLocaleDateString("es-AR")}
          </p>
        </div>
      </div>

      {role === "owner" && (
        <section className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
          <h2 className="text-[#f9f5f8] font-bold text-sm mb-3">
            Ajustar puntos manualmente
          </h2>
          <AdjustPointsForm userId={params.id} />
        </section>
      )}

      <section>
        <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase mb-3">
          Badges
        </h2>
        {(userBadges ?? []).length === 0 ? (
          <p className="text-[#adaaad] text-sm">Todavía no ganó ningún badge.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(userBadges ?? []).map((ub: any, i: number) => (
              <span
                key={i}
                className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-full px-3 py-1.5 text-xs text-[#f9f5f8]"
                title={ub.badges?.description}
              >
                {ub.badges?.name}
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase mb-3">
          Recompensas canjeadas
        </h2>
        {(redemptions ?? []).length === 0 ? (
          <p className="text-[#adaaad] text-sm">Todavía no canjeó nada.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(redemptions ?? []).map((r: any) => (
              <div
                key={r.id}
                className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-[#f9f5f8] text-sm font-semibold">
                    {r.rewards?.name}
                  </p>
                  <p className="text-[#adaaad] text-xs">
                    {new Date(r.created_at).toLocaleDateString("es-AR")} ·{" "}
                    {r.points_spent} KP
                  </p>
                  <p className="text-[#f9f5f8] font-black text-[11px] tracking-[1.5px] mt-1">
                    {r.code}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                    r.status === "fulfilled"
                      ? "bg-[#ff906d]/10 text-[#ff906d]"
                      : "bg-[#adaaad]/10 text-[#adaaad]"
                  }`}
                >
                  {r.status === "fulfilled" ? "Entregado" : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase mb-3">
          Asistencias recientes
        </h2>
        {(checkins ?? []).length === 0 ? (
          <p className="text-[#adaaad] text-sm">Todavía no registró check-ins.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {(checkins ?? []).map((c: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between px-1 py-2 border-b border-[rgba(72,71,74,0.1)]"
              >
                <p className="text-[#f9f5f8] text-xs">
                  {new Date(c.checkin_date).toLocaleDateString("es-AR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
                <span className="text-[#ff906d] font-black text-xs">
                  +{c.points_awarded} KP
                </span>
              </div>
            ))}
            {(checkinsCount ?? 0) > (checkins?.length ?? 0) && (
              <p className="text-[#adaaad]/70 text-[10px] mt-1">
                Mostrando las {checkins?.length} más recientes de {checkinsCount} en total.
              </p>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase mb-3">
          Movimientos de puntos
        </h2>
        {(ledger ?? []).length === 0 ? (
          <p className="text-[#adaaad] text-sm">Sin movimientos todavía.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {(ledger ?? []).map((l: any) => (
              <div
                key={l.id}
                className="flex items-center justify-between px-1 py-2 border-b border-[rgba(72,71,74,0.1)]"
              >
                <div>
                  <p className="text-[#f9f5f8] text-xs">
                    {REASON_LABELS[l.reason] ?? l.reason}
                  </p>
                  <p className="text-[#adaaad]/70 text-[10px]">
                    {new Date(l.created_at).toLocaleString("es-AR")}
                  </p>
                </div>
                <span
                  className={`font-black text-sm ${
                    l.amount >= 0 ? "text-[#ff906d]" : "text-[#adaaad]"
                  }`}
                >
                  {l.amount >= 0 ? "+" : ""}
                  {l.amount} KP
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
