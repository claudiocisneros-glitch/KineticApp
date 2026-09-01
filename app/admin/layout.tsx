import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStaffRole } from "@/lib/auth/staff";
import AdminNav from "@/components/admin/AdminNav";

const imgLogoIcon = "/logo.png";

// Guard único para toda /admin/*: cada page hija asume que ya está
// autenticado y confirmado como staff. Las secciones solo-dueño (ej.
// /admin/rewards) igual repiten su propio chequeo de isOwner server-side
// — este layout solo saca a quien no es staff en absoluto.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getStaffRole(user);
  if (!role) redirect("/"); // no es staff → afuera, sin explicar por qué

  return (
    <div className="min-h-screen bg-[#0e0e10]">
      <header className="flex items-center justify-between px-6 h-16 border-b border-[rgba(72,71,74,0.1)]">
        <div className="flex items-center gap-4 min-w-0">
          <img src={imgLogoIcon} alt="Kinetic Gym" className="h-7 shrink-0" />
          <h1 className="font-black text-lg text-[#f9f5f8] tracking-[-0.9px] uppercase truncate">
            Panel
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[#adaaad] text-[10px] font-bold uppercase tracking-[1px]">
            {role === "owner" ? "Dueño" : "Recepción"}
          </span>
          <Link
            href="/"
            className="text-[#adaaad] text-[10px] font-bold uppercase tracking-[1px] border border-[rgba(72,71,74,0.3)] rounded-full px-3 py-1.5"
          >
            Volver a la app
          </Link>
        </div>
      </header>

      <div className="pt-4">
        <AdminNav role={role} />
      </div>

      <main className="px-6 pb-24">{children}</main>
    </div>
  );
}
