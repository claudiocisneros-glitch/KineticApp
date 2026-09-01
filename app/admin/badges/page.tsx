import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/auth/staff";
import AwardBadgeForm from "@/components/admin/AwardBadgeForm";
import BadgesManager from "@/components/admin/BadgesManager";

export default async function AdminBadgesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!(await isOwner(user))) redirect("/admin");

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

  const holdersByBadge = new Map<string, { name: string; earnedAt: string }[]>();
  (userBadges ?? []).forEach((ub: any) => {
    const list = holdersByBadge.get(ub.badge_id) ?? [];
    list.push({ name: ub.profiles?.full_name ?? "Sin nombre", earnedAt: ub.earned_at });
    holdersByBadge.set(ub.badge_id, list);
  });

  return (
    <div className="pt-2 flex flex-col gap-6">
      <h1 className="text-2xl text-[#f9f5f8] font-black">Badges</h1>

      <BadgesManager badges={badges ?? []} />

      <section className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
        <h2 className="text-[#f9f5f8] font-bold text-sm mb-3">
          Otorgar badge manualmente
        </h2>
        <AwardBadgeForm
          members={(members ?? []).map((m: any) => ({ id: m.id, name: m.full_name ?? "Sin nombre" }))}
          badges={(badges ?? []).map((b: any) => ({ id: b.id, name: b.name }))}
        />
      </section>

      <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase -mb-2">
        Otorgados
      </h2>

      <div className="flex flex-col gap-4">
        {(badges ?? []).map((b: any) => {
          const holders = holdersByBadge.get(b.id) ?? [];
          return (
            <div
              key={b.id}
              className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#f9f5f8] font-bold text-sm">{b.name}</p>
                  <p className="text-[#adaaad] text-xs mt-1">{b.description}</p>
                </div>
                <span className="text-[#ff906d] font-black text-lg shrink-0">
                  {holders.length}
                </span>
              </div>
              {holders.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {holders.map((h, i) => (
                    <span
                      key={i}
                      className="bg-[#0e0e10] text-[#adaaad] text-[10px] px-2 py-1 rounded-full"
                    >
                      {h.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
