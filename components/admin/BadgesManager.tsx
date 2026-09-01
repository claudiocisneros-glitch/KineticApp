"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Badge = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_url: string | null;
};

type FormState = {
  code: string;
  name: string;
  description: string;
  icon_url: string;
};

const EMPTY_FORM: FormState = { code: "", name: "", description: "", icon_url: "" };

function BadgeForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Badge;
  onCancel?: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          code: initial.code,
          name: initial.name,
          description: initial.description ?? "",
          icon_url: initial.icon_url ?? "",
        }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || (!initial && !form.code.trim())) {
      setError("Código y nombre son obligatorios.");
      return;
    }

    setLoading(true);
    const body = initial
      ? {
          name: form.name.trim(),
          description: form.description.trim() || null,
          icon_url: form.icon_url.trim() || null,
        }
      : {
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description.trim() || null,
          icon_url: form.icon_url.trim() || null,
        };

    const res = initial
      ? await fetch(`/api/admin/badges/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/admin/badges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar.");
      return;
    }

    if (!initial) setForm(EMPTY_FORM);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {!initial && (
        <input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Código único (ej: socio_frecuente)"
          className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad]"
        />
      )}
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Nombre del badge"
        className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad]"
      />
      <input
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Descripción (opcional)"
        className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad]"
      />
      <input
        value={form.icon_url}
        onChange={(e) => setForm({ ...form, icon_url: e.target.value })}
        placeholder="URL del ícono (opcional — si lo dejás vacío se usa un ícono genérico)"
        className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad]"
      />
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
          {loading ? "Guardando..." : initial ? "Guardar cambios" : "Crear badge"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-5 py-2.5 text-[#adaaad] text-xs font-black uppercase tracking-[0.5px]"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export default function BadgesManager({ badges }: { badges: Badge[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[#f9f5f8] font-bold text-sm">Catálogo de badges</h2>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="bg-[#262528] text-[#f9f5f8] text-[10px] font-black uppercase tracking-[0.5px] rounded-lg px-3 py-2"
            >
              + Nuevo badge
            </button>
          )}
        </div>
        {creating && (
          <BadgeForm
            onCancel={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
              router.refresh();
            }}
          />
        )}
      </section>

      <div className="flex flex-col gap-3">
        {badges.map((b) =>
          editingId === b.id ? (
            <section
              key={b.id}
              className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5"
            >
              <BadgeForm
                initial={b}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            </section>
          ) : (
            <div
              key={b.id}
              className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-[#f9f5f8] font-bold text-sm truncate">{b.name}</p>
                <p className="text-[#adaaad] text-xs mt-1 truncate">
                  {b.code} {b.description ? `· ${b.description}` : ""}
                </p>
              </div>
              <button
                onClick={() => setEditingId(b.id)}
                className="bg-[#262528] text-[#f9f5f8] text-[10px] font-black uppercase tracking-[0.5px] rounded-lg px-3 py-2 shrink-0"
              >
                Editar
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
