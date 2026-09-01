import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/auth/staff";
import RewardsManager from "@/components/admin/RewardsManager";

export default async function AdminRewardsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!(await isOwner(user))) redirect("/admin"); // recepción no gestiona recompensas

  const admin = createAdminClient();
  const { data: rewards } = await admin
    .from("rewards")
    .select("*")
    .order("cost_points", { ascending: true });

  return (
    <div className="pt-2">
      <h1 className="text-2xl text-[#f9f5f8] font-black mb-6">Recompensas</h1>
      <RewardsManager initialRewards={rewards ?? []} />
    </div>
  );
}
