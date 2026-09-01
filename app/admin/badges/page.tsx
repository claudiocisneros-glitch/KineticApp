import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffRole } from "@/lib/auth/staff";
import BadgesSection from "@/components/admin/BadgesSection";

export default async function AdminBadgesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const role = await getStaffRole(user);
  if (!role) redirect("/");

  const admin = createAdminClient();

  const [{ data: badges }, { data: userBadges }, { data: members }] =
    await Promise.all([
      admin.from("badges").select("*").order("code"),
      admin.from("user_badges").select("badge_id, earned_at, profiles(full_name)"),
      admin
        .from("profiles")
        .select("id, full_name")
        .is("role", null)
        .order("full_name"),
    ]);

  const holdersByBadge: Record<string, { name: string; earnedAt: string }[]> = {};
  (userBadges ?? []).forEach((ub: any) => {
    const list = holdersByBadge[ub.badge_id] ?? [];
    list.push({ name: ub.profiles?.full_name ?? "Sin nombre", earnedAt: ub.earned_at });
    holdersByBadge[ub.badge_id] = list;
  });

  return (
    <div className="pt-2 flex flex-col gap-6">
      <h1 className="text-2xl text-[#f9f5f8] font-black">Badges</h1>

      <BadgesSection
        role={role}
        badges={badges ?? []}
        holdersByBadge={holdersByBadge}
        members={(members ?? []).map((m: any) => ({ id: m.id, name: m.full_name ?? "Sin nombre" }))}
      />
    </div>
  );
}
