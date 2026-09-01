import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffRole } from "@/lib/auth/staff";
import RedemptionsTable from "@/components/admin/RedemptionsTable";

export default async function AdminRedemptionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const role = await getStaffRole(user);
  if (!role) redirect("/");

  const admin = createAdminClient();
  const { data: redemptions } = await admin
    .from("redemptions")
    .select("*, profiles(full_name), rewards(name)")
    .order("created_at", { ascending: false });

  const rows = (redemptions ?? []).map((r: any) => ({
    id: r.id,
    memberName: r.profiles?.full_name ?? "Sin nombre",
    rewardName: r.rewards?.name ?? "—",
    pointsSpent: r.points_spent,
    status: r.status as "pending" | "fulfilled",
    createdAt: r.created_at,
  }));

  return (
    <div className="pt-2">
      <h1 className="text-2xl text-[#f9f5f8] font-black mb-6">Canjes</h1>
      <RedemptionsTable redemptions={rows} />
    </div>
  );
}
