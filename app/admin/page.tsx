import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffRole } from "@/lib/auth/staff";
import FulfillButton from "@/components/FulfillButton";
import QrGenerator from "@/components/QrGenerator";

type Range = "today" | "7d" | "30d" | "all";

const RANGE_LABELS: Record<Range, string> = {
  today: "Hoy",
  "7d": "Últimos 7 días",
  "30d": "Último mes",
  all: "Total",
};

function rangeStart(range: Range): Date | null {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "today") return start;
  if (range === "7d") {
    start.setDate(start.getDate() - 6);
    return start;
  }
  if (range === "30d") {
    start.setDate(start.getDate() - 29);
    return start;
  }
  return null; // "all" → sin piso de fecha
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex flex-col gap-1">
      <p className="text-[#adaaad] text-[10px] font-bold uppercase tracking-[1px]">
        {label}
      </p>
      <p className="text-[#f9f5f8] font-black text-2xl tracking-[-0.5px]">
        {value}
      </p>
      {sub && <p className="text-[#adaaad]/70 text-[10px] font-bold">{sub}</p>}
    </div>
  );
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getStaffRole(user);
  if (!role) redirect("/");

  const admin = createAdminClient();

  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: lastQrRows } = await admin
    .from("gym_qr_codes")
    .select("code, valid_from")
    .order("valid_from", { ascending: false })
    .limit(1);

  const lastQr = lastQrRows?.[0] ?? null;
  const generatedToday = lastQr ? lastQr.valid_from.slice(0, 10) === todayStr : false;

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
        <QrGenerator
          currentCode={generatedToday ? lastQr!.code : null}
          lastGeneratedAt={lastQr?.valid_from ?? null}
          generatedToday={generatedToday}
        />

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
                <p className="text-[#f9f5f8] font-black text-xs tracking-[1.5px] mt-1">
                  {r.code}
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
  const range: Range = (["today", "7d", "30d", "all"] as const).includes(
    searchParams.range as Range
  )
    ? (searchParams.range as Range)
    : "7d";

  const start = rangeStart(range);

  let checkinsQuery = admin
    .from("checkins")
    .select("*", { count: "exact", head: true });
  let ledgerQuery = admin
    .from("points_ledger")
    .select("amount")
    .eq("reason", "checkin");
  let badgesQuery = admin
    .from("user_badges")
    .select("*", { count: "exact", head: true });

  let newMembersQuery = admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .is("role", null);

  if (start) {
    checkinsQuery = checkinsQuery.gte("checkin_date", start.toISOString().slice(0, 10));
    ledgerQuery = ledgerQuery.gte("created_at", start.toISOString());
    badgesQuery = badgesQuery.gte("earned_at", start.toISOString());
    newMembersQuery = newMembersQuery.gte("member_since", start.toISOString().slice(0, 10));
  }

  const [
    { count: totalMembers },
    { count: newMembersInRange },
    { count: checkinsInRange },
    { count: badgesInRange },
    { data: ledgerRows },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .is("role", null),
    newMembersQuery,
    checkinsQuery,
    badgesQuery,
    ledgerQuery,
  ]);

  const pointsInRange = (ledgerRows ?? []).reduce(
    (sum, row: any) => sum + row.amount,
    0
  );

  return (
    <div className="pt-2 flex flex-col gap-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase">
            Resumen
          </h2>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {(["today", "7d", "30d", "all"] as const).map((r) => (
            <Link
              key={r}
              href={`/admin?range=${r}`}
              className="shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.5px]"
              style={
                range === r
                  ? {
                      backgroundImage:
                        "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
                      color: "#0e0e10",
                    }
                  : { backgroundColor: "#1f1f22", color: "#adaaad" }
              }
            >
              {RANGE_LABELS[r]}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label={
              range === "all"
                ? "Socios"
                : `Socios nuevos (${RANGE_LABELS[range].toLowerCase()})`
            }
            value={range === "all" ? totalMembers ?? 0 : newMembersInRange ?? 0}
            sub={range === "all" ? undefined : `${(totalMembers ?? 0).toLocaleString()} en total`}
          />
          <StatCard
            label={`Check-ins (${RANGE_LABELS[range].toLowerCase()})`}
            value={checkinsInRange ?? 0}
          />
          <StatCard
            label={`KP entregados (${RANGE_LABELS[range].toLowerCase()})`}
            value={pointsInRange.toLocaleString()}
          />
          <StatCard
            label={`Badges otorgados (${RANGE_LABELS[range].toLowerCase()})`}
            value={badgesInRange ?? 0}
          />
          <StatCard
            label="Canjes pendientes"
            value={pendingRedemptions?.length ?? 0}
          />
        </div>
      </section>

      <QrGenerator
        currentCode={generatedToday ? lastQr!.code : null}
        lastGeneratedAt={lastQr?.valid_from ?? null}
        generatedToday={generatedToday}
      />

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
                <p className="text-[#f9f5f8] font-black text-xs tracking-[1.5px] mt-1">
                  {r.code}
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
