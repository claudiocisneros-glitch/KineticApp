"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Created = {
  fullName: string;
  email: string;
  tempPassword: string;
  referralCode: string | null;
};

const inputCls =
  "bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad]";

export default function NewMemberForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        referral_code: refCode || null,
      }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear el socio.");
      return;
    }
    setCreated(data);
    setFullName("");
    setEmail("");
    setRefCode("");
    router.refresh();
  }

  // Panel de éxito: muestra los datos para pasarle al socio (una sola vez).
  if (created) {
    return (
      <div className="bg-[#1f1f22] border border-[rgba(255,144,109,0.25)] rounded-2xl p-5 mb-6">
        <p className="text-[#f9f5f8] font-black text-sm mb-1">
          Socio creado: {created.fullName}
        </p>
        <p className="text-[#adaaad] text-xs mb-4">
          Anotá estos datos y pasáselos al socio — la contraseña no se vuelve a
          mostrar.
        </p>
        <div className="flex flex-col gap-2 text-sm">
          <Row label="Email" value={created.email} />
          <Row label="Contraseña temporal" value={created.tempPassword} mono />
          {created.referralCode && (
            <Row label="Su código de referido" value={created.referralCode} mono />
          )}
        </div>
        <button
          onClick={() => setCreated(null)}
          className="mt-4 rounded-xl px-5 py-2.5 text-black text-xs font-black uppercase tracking-[0.5px]"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
          }}
        >
          Crear otro
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-6 rounded-xl px-5 py-3 text-black text-sm font-black uppercase tracking-[0.5px] w-full sm:w-auto"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
        }}
      >
        + Nuevo socio
      </button>
    );
  }

  return (
    <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5 mb-6">
      <h2 className="text-[#f9f5f8] font-bold text-sm mb-3">Nuevo socio</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nombre y apellido"
          className={inputCls}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={inputCls}
        />
        <div className="flex flex-col gap-1">
          <input
            value={refCode}
            onChange={(e) => setRefCode(e.target.value.toUpperCase())}
            placeholder="Código de quien lo trajo (opcional)"
            className={inputCls}
          />
          <p className="text-[#adaaad]/70 text-[11px] pl-1">
            Si un socio lo recomendó, cargá su código. El premio se otorga en el
            primer check-in del nuevo socio.
          </p>
        </div>

        {error && <p className="text-[#ff66b6] text-xs">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl px-5 py-2.5 text-black text-xs font-black uppercase tracking-[0.5px] disabled:opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
            }}
          >
            {loading ? "Creando..." : "Crear socio"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            className="rounded-xl px-5 py-2.5 text-[#adaaad] text-xs font-black uppercase tracking-[0.5px]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#0e0e10] border border-[rgba(72,71,74,0.15)] rounded-lg px-3 py-2">
      <span className="text-[#adaaad] text-xs">{label}</span>
      <span
        className={`text-[#f9f5f8] font-bold ${
          mono ? "tracking-[1.5px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
