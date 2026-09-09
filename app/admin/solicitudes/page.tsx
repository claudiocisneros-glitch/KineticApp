import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffRole } from "@/lib/auth/staff";
import ApprovalActions from "@/components/admin/ApprovalActions";

export default async function AdminSolicitudesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = await getStaffRole(user);
  if (!role) redirect("/");

  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("profiles")
    .select("id, full_name, created_at, referred_by")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const list = pending ?? [];

  // Emails (viven en Auth) y nombre de quien lo refirió
  const withInfo = await Promise.all(
    list.map(async (p: any) => {
      const { data: au } = await admin.auth.admin.getUserById(p.id);
      let referrer: string | null = null;
      if (p.referred_by) {
        const { data: r } = await admin
          .from("profiles")
          .select("full_name")
          .eq("id", p.referred_by)
          .maybeSingle();
        referrer = r?.full_name ?? null;
      }
      return {
        ...p,
        email: au?.user?.email ?? "—",
        referrer,
      };
    })
  );

  return (
    <div className="pt-2 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-[#f9f5f8] font-black">Solicitudes</h1>
        <p className="text-[#adaaad] text-xs mt-1">
          Altas pendientes de aprobación. Aprobá a quienes ya se asociaron.
        </p>
      </div>

      {withInfo.length === 0 ? (
        <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-6 text-center">
          <p className="text-[#f9f5f8] text-sm font-semibold">
            No hay solicitudes pendientes
          </p>
          <p className="text-[#adaaad] text-xs mt-1">
            Cuando alguien se registre, va a aparecer acá.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {withInfo.map((p) => (
            <div
              key={p.id}
              className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-[#f9f5f8] font-bold text-sm truncate">
                  {p.full_name ?? "Sin nombre"}
                </p>
                <p className="text-[#adaaad] text-xs truncate">{p.email}</p>
                <p className="text-[#adaaad]/70 text-[11px] mt-0.5">
                  {new Date(p.created_at).toLocaleDateString("es-AR")}
                  {p.referrer ? ` · por referido de ${p.referrer}` : ""}
                </p>
              </div>
              <ApprovalActions userId={p.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
