import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaff } from "@/lib/auth/staff";
import FulfillButton from "@/components/FulfillButton";
import QrGenerator from "@/components/QrGenerator";

async function requireStaff() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!isStaff(user)) redirect("/"); // no es staff → afuera, sin explicar por qué
}

export default async function AdminPage() {
  await requireStaff();

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

  return (
    <main className="min-h-screen bg-[#0e0e10] px-6 pt-8 pb-24">
      <h1 className="text-2xl text-[#f9f5f8] font-black mb-6">
        Panel Kinetic Gym
      </h1>

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
    </main>
  );
}
