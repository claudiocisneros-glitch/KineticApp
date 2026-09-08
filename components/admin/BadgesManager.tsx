"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";

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

const inputCls =
  "bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad]";

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
          className={inputCls}
        />
      )}
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Nombre del badge"
        className={inputCls}
      />
      <input
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Descripción (opcional)"
        className={inputCls}
      />
      <input
        value={form.icon_url}
        onChange={(e) => setForm({ ...form, icon_url: e.target.value })}
        placeholder="URL del ícono (opcional — vacío usa un ícono genérico)"
        className={inputCls}
      />
      {error && <p className="text-[#ff66b6] text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-5 py-2.5 text-black text-xs font-black uppercase tracking-[0.5px] disabled:opacity-50"
          style={{ backgroundImage: GRAD }}
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(b: Badge) {
    if (
      !window.confirm(
        `¿Eliminar el badge "${b.name}"? Se lo quita a los socios que ya lo tengan. Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    setDeletingId(b.id);
    const res = await fetch(`/api/admin/badges/${b.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo eliminar el badge.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Nuevo badge — mismo estilo que "Nuevo socio" */}
      {creating ? (
        <section className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
          <h2 className="text-[#f9f5f8] font-bold text-sm mb-3">Nuevo badge</h2>
          <BadgeForm
            onCancel={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
              router.refresh();
            }}
          />
        </section>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="rounded-xl px-5 py-3 text-black text-sm font-black uppercase tracking-[0.5px] w-full sm:w-auto self-start"
          style={{ backgroundImage: GRAD }}
        >
          + Nuevo badge
        </button>
      )}

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
              <div className="min-w-0 flex items-center gap-3">
                {b.icon_url ? (
                  <img src={b.icon_url} alt="" className="size-10 shrink-0" />
                ) : (
                  <div className="size-10 rounded-full bg-[#ff906d]/10 flex items-center justify-center text-[#ff906d] font-black shrink-0">
                    ★
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[#f9f5f8] font-bold text-sm truncate">
                    {b.name}
                  </p>
                  <p className="text-[#adaaad] text-xs mt-1 truncate">
                    {b.code} {b.description ? `· ${b.description}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditingId(b.id)}
                  className="bg-[#262528] text-[#f9f5f8] text-[10px] font-black uppercase tracking-[0.5px] rounded-lg px-3 py-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(b)}
                  disabled={deletingId === b.id}
                  className="bg-[#262528] text-[#ff66b6] text-[10px] font-black uppercase tracking-[0.5px] rounded-lg px-3 py-2 disabled:opacity-50"
                >
                  {deletingId === b.id ? "..." : "Eliminar"}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
