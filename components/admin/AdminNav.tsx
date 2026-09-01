"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StaffRole } from "@/lib/auth/staff";

// Recepción ve un subconjunto: lo que necesita para el día a día
// (QR, canjes, consultar socios). Dueño ve todo. Nada de esto es una
// medida de seguridad por sí sola — cada página/route sigue validando
// el rol server-side — es solo para no mostrar links a secciones a
// las que igual no tienen acceso.
const NAV_ITEMS: { href: string; label: string; roles: StaffRole[] }[] = [
  { href: "/admin", label: "Inicio", roles: ["owner", "reception"] },
  { href: "/admin/users", label: "Socios", roles: ["owner", "reception"] },
  {
    href: "/admin/redemptions",
    label: "Canjes",
    roles: ["owner", "reception"],
  },
  { href: "/admin/rewards", label: "Recompensas", roles: ["owner"] },
  { href: "/admin/badges", label: "Badges", roles: ["owner", "reception"] },
  { href: "/admin/staff", label: "Staff", roles: ["owner"] },
];

export default function AdminNav({ role }: { role: StaffRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex gap-2 overflow-x-auto no-scrollbar px-6 pb-4 -mt-2">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.5px]"
            style={
              active
                ? {
                    backgroundImage:
                      "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
                    color: "#0e0e10",
                  }
                : { backgroundColor: "#1f1f22", color: "#adaaad" }
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
