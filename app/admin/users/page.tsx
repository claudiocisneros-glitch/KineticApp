import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffRole } from "@/lib/auth/staff";
import UsersTable from "@/components/admin/UsersTable";

export default async function AdminUsersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const role = await getStaffRole(user);
  if (!role) redirect("/");

  const admin = createAdminClient();

  const [{ data: profiles }, { data: balances }, { data: checkinRows }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, member_since, current_streak_weeks, last_checkin_at")
        .is("role", null)
        .order("full_name", { ascending: true }),
      admin.from("user_points_balance").select("user_id, balance"),
      admin.from("checkins").select("user_id"),
    ]);

  const balanceByUser = new Map(
    (balances ?? []).map((b: any) => [b.user_id, b.balance as number])
  );

  const checkinCountByUser = new Map<string, number>();
  (checkinRows ?? []).forEach((c: any) => {
    checkinCountByUser.set(c.user_id, (checkinCountByUser.get(c.user_id) ?? 0) + 1);
  });

  const members = (profiles ?? []).map((p: any) => ({
    id: p.id,
    fullName: p.full_name ?? "Sin nombre",
    memberSince: p.member_since,
    currentStreakWeeks: p.current_streak_weeks,
    lastCheckinAt: p.last_checkin_at,
    balance: balanceByUser.get(p.id) ?? 0,
    totalCheckins: checkinCountByUser.get(p.id) ?? 0,
  }));

  return (
    <div className="pt-2">
      <h1 className="text-2xl text-[#f9f5f8] font-black mb-6">Socios</h1>
      <UsersTable members={members} />
    </div>
  );
}
