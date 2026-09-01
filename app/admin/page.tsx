import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffRole } from "@/lib/auth/staff";
import FulfillButton from "@/components/FulfillButton";
import QrGenerator from "@/components/QrGenerator";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex flex-col gap-1">
      <p className="text-[#adaaad] text-[10px] font-bold uppercase tracking-[1px]">
        {label}
      </p>
      <p className="text-[#f9f5f8] font-black text-2xl tracking-[-0.5px]">
        {value}
      </p>
    </div>
  );
}

export default async function AdminHomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getStaffRole(user);
  if (!role) redirect("/");

  const admin = createAdminClient();

  const { data: activeQrRows } = await admin
    .from("gym_qr_codes")
    .select("code")
    .gte("valid_until", new Date().toISOString())
    .order("valid_from", { ascending: false })
    .limit(1);

  const activeQr = activeQrRows?.[0] ?? null;

  const { data: pendingRedemptions } = await admin
    .from("redemptions")
    .select("*, profiles(full_name), rewards(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  // La vista de Recepción es la pantalla del día a día: generar el QR y
  // despachar canjes. Sin métricas de negocio — eso es para el dueño.
  if (role === "reception") {
    return (
      <div className="pt-2">
        <QrGenerator currentCode={activeQr?.code ?? null} />

        <h2 className="text-xl text-[#f9f5f8] font-black mb-4">
          Canjes pendientes
        </h2>

        <div className="space-y-3">
          {(pendingRedemptions ?? []).length === 0 && (
            <p className="text-[#adaaad] text-sm">No hay canjes pendientes.</p>
          )}
          {(pendingRedemptions ?? []).map((r: any) => (
            <div
              key={r.id}
              className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-[#f9f5f8] font-semibold">{r.rewards.name}</p>
                <p className="text-[#adaaad] text-xs">
                  {r.profiles.full_name} · {r.points_spent} KP
                </p>
              </div>
              <FulfillButton redemptionId={r.id} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Dueño: dashboard con métricas + los mismos accesos rápidos de
  // recepción (no tiene sentido que el dueño tenga que ir a otra
  // sección para generar el QR si hace falta).
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [
    { count: totalMembers },
    { count: checkinsToday },
    { count: checkinsThisWeek },
    { count: totalBadgesAwarded },
    { data: weeklyLedgerRows },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .is("role", null),
    admin
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .eq("checkin_date", todayStart.toISOString().slice(0, 10)),
    admin
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .gte("checkin_date", weekAgo.toISOString().slice(0, 10)),
    admin.from("user_badges").select("*", { count: "exact", head: true }),
    admin
      .from("points_ledger")
      .select("amount")
      .eq("reason", "checkin")
      .gte("created_at", weekAgo.toISOString()),
  ]);

  const pointsThisWeek = (weeklyLedgerRows ?? []).reduce(
    (sum, row: any) => sum + row.amount,
    0
  );

  return (
    <div className="pt-2 flex flex-col gap-8">
      <section>
        <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase mb-4">
          Resumen
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Socios" value={totalMembers ?? 0} />
          <StatCard label="Check-ins hoy" value={checkinsToday ?? 0} />
          <StatCard label="Check-ins (7 días)" value={checkinsThisWeek ?? 0} />
          <StatCard label="KP entregados (7 días)" value={pointsThisWeek.toLocaleString()} />
          <StatCard
            label="Canjes pendientes"
            value={pendingRedemptions?.length ?? 0}
          />
          <StatCard label="Badges otorgados" value={totalBadgesAwarded ?? 0} />
        </div>
      </section>

      <QrGenerator currentCode={activeQr?.code ?? null} />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl text-[#f9f5f8] font-black">
            Canjes pendientes
          </h2>
          <Link
            href="/admin/redemptions"
            className="text-[#ff906d] text-xs font-black uppercase tracking-[0.5px]"
          >
            Ver todos →
          </Link>
        </div>

        <div className="space-y-3">
          {(pendingRedemptions ?? []).length === 0 && (
            <p className="text-[#adaaad] text-sm">No hay canjes pendientes.</p>
          )}
          {(pendingRedemptions ?? []).slice(0, 5).map((r: any) => (
            <div
              key={r.id}
              className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-[#f9f5f8] font-semibold">{r.rewards.name}</p>
                <p className="text-[#adaaad] text-xs">
                  {r.profiles.full_name} · {r.points_spent} KP
                </p>
              </div>
              <FulfillButton redemptionId={r.id} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
