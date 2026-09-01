import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/auth/staff";
import StaffManager from "@/components/admin/StaffManager";

export default async function AdminStaffPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!(await isOwner(user))) redirect("/admin");

  const admin = createAdminClient();

  const [{ data: staffProfiles }, { data: invites }, { data: authUsers }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, role")
        .not("role", "is", null),
      admin.from("staff_role_invites").select("*").order("created_at"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  const emailById = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? "—"])
  );

  const staff = (staffProfiles ?? []).map((p: any) => ({
    id: p.id,
    name: p.full_name ?? "Sin nombre",
    email: emailById.get(p.id) ?? "—",
    role: p.role as "owner" | "reception",
  }));

  return (
    <div className="pt-2 flex flex-col gap-6">
      <h1 className="text-2xl text-[#f9f5f8] font-black">Staff</h1>
      <p className="text-[#adaaad] text-sm -mt-4">
        Asigná un rol por email. Si la persona todavía no se registró, el
        rol se le aplica automáticamente apenas cree su cuenta con ese
        mismo email.
      </p>

      <StaffManager
        staff={staff}
        invites={(invites ?? []).map((i: any) => ({
          email: i.email,
          role: i.role,
        }))}
      />
    </div>
  );
}
