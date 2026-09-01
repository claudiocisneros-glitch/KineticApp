"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditNameForm({
  userId,
  initialName,
}: {
  userId: string;
  initialName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: name.trim() }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar.");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setName(initialName);
          setEditing(true);
        }}
        className="text-[#adaaad] text-xs font-bold uppercase tracking-[0.5px] border border-[rgba(72,71,74,0.3)] rounded-full px-3 py-1.5 mt-2"
      >
        Editar nombre
      </button>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex items-center gap-2 mt-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className="bg-[#0e0e10] border border-[rgba(72,71,74,0.2)] rounded-xl px-3 py-2 text-sm text-[#f9f5f8]"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl px-4 py-2 text-black text-xs font-black uppercase tracking-[0.5px] disabled:opacity-50 shrink-0"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)",
        }}
      >
        {loading ? "..." : "Guardar"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-[#adaaad] text-xs font-bold uppercase tracking-[0.5px]"
      >
        Cancelar
      </button>
      {error && <p className="text-[#ff66b6] text-xs">{error}</p>}
    </form>
  );
}
