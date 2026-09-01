"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Reward = {
  id: string;
  name: string;
  description: string | null;
  cost_points: number;
  is_active: boolean;
  max_redemptions_per_user: number | null;
};

type FormState = {
  name: string;
  description: string;
  cost_points: string;
  max_redemptions_per_user: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  cost_points: "",
  max_redemptions_per_user: "",
};

function RewardForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Reward;
  onCancel?: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? "",
          cost_points: String(initial.cost_points),
          max_redemptions_per_user:
            initial.max_redemptions_per_user != null
              ? String(initial.max_redemptions_per_user)
              : "",
        }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cost = parseInt(form.cost_points, 10);
    if (!form.name.trim() || Number.isNaN(cost) || cost < 0) {
      setError("Nombre y costo en puntos son obligatorios.");
      return;
    }

    setLoading(true);
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      cost_points: cost,
      max_redemptions_per_user: form.max_redemptions_per_user.trim()
        ? parseInt(form.max_redemptions_per_user, 10)
        : null,
    };

    const res = initial
      ? await fetch(`/api/admin/rewards/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/admin/rewards", {
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
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Nombre de la recompensa"
        className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad]"
      />
      <input
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Descripción (opcional)"
        className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad]"
      />
      <div className="flex gap-3">
        <input
          type="number"
          value={form.cost_points}
          onChange={(e) => setForm({ ...form, cost_points: e.target.value })}
          placeholder="Costo en KP"
          className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad] flex-1"
        />
        <input
          type="number"
          value={form.max_redemptions_per_user}
          onChange={(e) =>
            setForm({ ...form, max_redemptions_per_user: e.target.value })
          }
          placeholder="Límite por socio (opcional)"
          className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#f9f5f8] placeholder:text-[#adaaad] flex-1"
        />
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
          {loading ? "Guardando..." : initial ? "Guardar cambios" : "Crear recompensa"}
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

export default function RewardsManager({
  initialRewards,
}: {
  initialRewards: Reward[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function toggleActive(reward: Reward) {
    setTogglingId(reward.id);
    await fetch(`/api/admin/rewards/${reward.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !reward.is_active }),
    });
    setTogglingId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
        <h2 className="text-[#f9f5f8] font-bold text-sm mb-3">
          Nueva recompensa
        </h2>
        <RewardForm onSaved={() => router.refresh()} />
      </section>

      <div className="flex flex-col gap-3">
        {initialRewards.map((r) =>
          editingId === r.id ? (
            <section
              key={r.id}
              className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5"
            >
              <RewardForm
                initial={r}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            </section>
          ) : (
            <div
              key={r.id}
              className={`bg-[#1f1f22] border rounded-2xl p-4 flex items-center justify-between gap-3 ${
                r.is_active
                  ? "border-[rgba(72,71,74,0.1)]"
                  : "border-[rgba(72,71,74,0.05)] opacity-60"
              }`}
            >
              <div className="min-w-0">
                <p className="text-[#f9f5f8] font-bold text-sm truncate">
                  {r.name}
                </p>
                <p className="text-[#adaaad] text-xs mt-1">
                  {r.cost_points.toLocaleString()} KP
                  {r.max_redemptions_per_user != null &&
                    ` · máx ${r.max_redemptions_per_user} por socio`}
                  {!r.is_active && " · inactiva"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditingId(r.id)}
                  className="bg-[#262528] text-[#f9f5f8] text-[10px] font-black uppercase tracking-[0.5px] rounded-lg px-3 py-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActive(r)}
                  disabled={togglingId === r.id}
                  className="bg-[#262528] text-[#adaaad] text-[10px] font-black uppercase tracking-[0.5px] rounded-lg px-3 py-2 disabled:opacity-50"
                >
                  {r.is_active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
