"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "reception";
};

type Invite = { email: string; role: "owner" | "reception" };

const ROLE_LABEL: Record<string, string> = {
  owner: "Dueño",
  reception: "Recepción",
};

export default function StaffManager({
  staff,
  invites,
}: {
  staff: StaffMember[];
  invites: Invite[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "reception">("reception");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Ingresá un email.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/staff/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo asignar el rol.");
      return;
    }

    setEmail("");
    router.refresh();
  }

  async function handleRevoke(userId: string) {
    setBusyKey(userId);
    await fetch("/api/admin/staff/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setBusyKey(null);
    router.refresh();
  }

  async function handleCancelInvite(inviteEmail: string) {
    setBusyKey(inviteEmail);
    await fetch("/api/admin/staff/cancel-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    setBusyKey(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
        <h2 className="text-[#f9f5f8] font-bold text-sm mb-3">
          Asignar rol
        </h2>
        <form onSubmit={handleAssign} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad] flex-1"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "owner" | "reception")}
            className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8]"
          >
            <option value="reception">Recepción</option>
            <option value="owner">Dueño</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl px-5 py-2.5 text-black text-xs font-black uppercase tracking-[0.5px] disabled:opacity-50 shrink-0"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
            }}
          >
            {loading ? "Asignando..." : "Asignar"}
          </button>
        </form>
        {error && <p className="text-[#ff66b6] text-xs mt-2">{error}</p>}
      </section>

      <section>
        <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase mb-3">
          Staff activo
        </h2>
        {staff.length === 0 ? (
          <p className="text-[#adaaad] text-sm">Nadie más tiene rol asignado todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {staff.map((s) => (
              <div
                key={s.id}
                className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[#f9f5f8] font-semibold text-sm truncate">
                    {s.name}
                  </p>
                  <p className="text-[#adaaad] text-xs mt-1">
                    {s.email} · {ROLE_LABEL[s.role]}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(s.id)}
                  disabled={busyKey === s.id}
                  className="bg-[#262528] text-[#adaaad] text-[10px] font-black uppercase tracking-[0.5px] rounded-lg px-3 py-2 disabled:opacity-50 shrink-0"
                >
                  Quitar acceso
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {invites.length > 0 && (
        <section>
          <h2 className="text-[#adaaad] text-sm font-black tracking-[3.2px] uppercase mb-3">
            Invitaciones pendientes
          </h2>
          <p className="text-[#adaaad]/70 text-xs -mt-2 mb-3">
            Todavía no se registraron en la app — el rol se les asigna solo
            cuando lo hagan.
          </p>
          <div className="flex flex-col gap-2">
            {invites.map((i) => (
              <div
                key={i.email}
                className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <p className="text-[#f9f5f8] text-sm">
                  {i.email} · {ROLE_LABEL[i.role]}
                </p>
                <button
                  onClick={() => handleCancelInvite(i.email)}
                  disabled={busyKey === i.email}
                  className="bg-[#262528] text-[#adaaad] text-[10px] font-black uppercase tracking-[0.5px] rounded-lg px-3 py-2 disabled:opacity-50 shrink-0"
                >
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
