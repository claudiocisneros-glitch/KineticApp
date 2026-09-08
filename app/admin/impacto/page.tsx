import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/auth/staff";
import ImpactoChart from "@/components/admin/ImpactoChart";

const GRAD =
  "linear-gradient(135deg, rgb(255, 120, 77) 0%, rgb(255, 102, 182) 100%)";
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Definición de socio activo (configurable a futuro). Afecta KPIs y cohortes.
const ACTIVE_WINDOW_DAYS = 21;

function monthKey(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

function EjemploTag() {
  return (
    <span className="text-[9px] font-black uppercase tracking-[0.5px] text-[#adaaad] border border-[rgba(72,71,74,0.35)] rounded px-1.5 py-0.5">
      Datos de ejemplo
    </span>
  );
}

function Hero({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#1f1f22] border border-[rgba(72,71,74,0.1)] rounded-2xl p-4 flex flex-col gap-1 overflow-hidden">
      <p className="text-[#adaaad] text-[10px] font-bold uppercase tracking-[1px]">
        {label}
      </p>
      <p className="text-[#f9f5f8] font-black text-2xl tracking-[-0.5px]">
        {value}
      </p>
      {sub && <p className="text-[#adaaad]/70 text-[10px] font-bold">{sub}</p>}
      <div
        className="h-[3px] rounded-full -mx-4 mt-1"
        style={accent ? { backgroundImage: GRAD } : { backgroundColor: "#2a2a30" }}
      />
    </div>
  );
}

export default async function ImpactoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isOwner(user))) redirect("/admin");

  const admin = createAdminClient();

  // ------- Datos reales -------
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [{ data: members }, { data: checkins }] = await Promise.all([
    admin.from("profiles").select("id, member_since").is("role", null),
    admin
      .from("checkins")
      .select("user_id, checkin_date")
      .gte("checkin_date", sixMonthsAgo.toISOString().slice(0, 10)),
  ]);

  const memberList = members ?? [];
  const checkinList = checkins ?? [];

  // Meses activos por usuario (para cohortes y retención)
  const activeMonths = new Map<string, Set<string>>();
  // Último check-in por usuario (para "activos" por ventana de días)
  const activeSet = new Set<string>();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - (ACTIVE_WINDOW_DAYS - 1));
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  for (const c of checkinList) {
    const d = new Date(c.checkin_date + "T00:00");
    const key = monthKey(d.getFullYear(), d.getMonth());
    if (!activeMonths.has(c.user_id)) activeMonths.set(c.user_id, new Set());
    activeMonths.get(c.user_id)!.add(key);
    if (c.checkin_date >= cutoffStr) activeSet.add(c.user_id);
  }

  const totalMembers = memberList.length;
  const activeMembers = activeSet.size;

  // Retención mensual: de los activos el mes pasado, cuántos siguen activos este mes
  const thisMonthKey = monthKey(now.getFullYear(), now.getMonth());
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = monthKey(lastMonthDate.getFullYear(), lastMonthDate.getMonth());
  let activeLast = 0;
  let retained = 0;
  for (const [uid, months] of activeMonths) {
    if (months.has(lastMonthKey)) {
      activeLast++;
      if (months.has(thisMonthKey)) retained++;
    }
  }
  const retentionPct = activeLast > 0 ? Math.round((retained / activeLast) * 100) : null;

  // Cohortes: últimos 4 meses de alta, offsets 0..3
  const membersByCohort = new Map<string, string[]>();
  for (const p of memberList) {
    if (!p.member_since) continue;
    const d = new Date(p.member_since + "T00:00");
    const key = monthKey(d.getFullYear(), d.getMonth());
    if (!membersByCohort.has(key)) membersByCohort.set(key, []);
    membersByCohort.get(key)!.push(p.id);
  }

  const curIndex = now.getFullYear() * 12 + now.getMonth();
  const cohortRows = [] as {
    label: string;
    size: number;
    cells: (number | null)[];
  }[];
  for (let back = 3; back >= 0; back--) {
    const cy = now.getFullYear();
    const cm = now.getMonth() - back;
    const cohortDate = new Date(cy, cm, 1);
    const key = monthKey(cohortDate.getFullYear(), cohortDate.getMonth());
    const ids = membersByCohort.get(key) ?? [];
    const size = ids.length;
    const cells: (number | null)[] = [];
    for (let k = 0; k <= 3; k++) {
      const targetIndex = cohortDate.getFullYear() * 12 + cohortDate.getMonth() + k;
      if (targetIndex > curIndex) {
        cells.push(null); // mes que todavía no transcurrió
        continue;
      }
      if (size === 0) {
        cells.push(null);
        continue;
      }
      if (k === 0) {
        cells.push(100);
        continue;
      }
      const td = new Date(
        cohortDate.getFullYear(),
        cohortDate.getMonth() + k,
        1
      );
      const tKey = monthKey(td.getFullYear(), td.getMonth());
      let activeInMonth = 0;
      for (const id of ids) {
        if (activeMonths.get(id)?.has(tKey)) activeInMonth++;
      }
      cells.push(Math.round((activeInMonth / size) * 100));
    }
    cohortRows.push({
      label: MONTHS[cohortDate.getMonth()],
      size,
      cells,
    });
  }

  function shade(v: number | null) {
    if (v === null) return null;
    const t = Math.max(0, Math.min(1, (v - 55) / 45));
    const base = [35, 35, 41];
    const hot = [255, 107, 92];
    return `rgb(${base.map((c, i) => Math.round(c + (hot[i] - c) * t)).join(",")})`;
  }

  return (
    <div className="pt-2 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl text-[#f9f5f8] font-black">IMPACTO</h1>
        <p className="text-[#adaaad] text-xs mt-1">
          Retención y engagement del gimnasio.
        </p>
      </div>

      {/* KPIs reales */}
      <div className="grid grid-cols-3 gap-3">
        <Hero label="Socios activos" value={activeMembers.toLocaleString()} sub={`${totalMembers.toLocaleString()} en total`} accent />
        <Hero
          label="Retención mensual"
          value={retentionPct !== null ? `${retentionPct}%` : "—"}
          sub="vs. mes anterior"
          accent
        />
        <Hero label="Altas por referido" value="31" sub="datos de ejemplo" />
      </div>

      {/* Seguimiento (ejemplo hasta tener el motor de riesgo) */}
      <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-[#f9f5f8] font-black text-lg">Seguimiento de socios</h2>
          <EjemploTag />
        </div>
        <p className="text-[#adaaad] text-xs mb-4">
          Cuando la línea de riesgo baja y la de activos sube, el sistema está
          reteniendo. La lista de abajo es la tarea de contacto del staff.
        </p>

        <ImpactoChart />

        <p className="text-[11px] font-black uppercase tracking-[1px] text-[#adaaad] mt-6 mb-3">
          Socios en riesgo — contactar
        </p>
        <div className="border border-[rgba(72,71,74,0.15)] rounded-xl overflow-hidden">
          {[
            ["Juan Pérez", "Racha por caerse · hace 2 días", "Alto"],
            ["Ana González", "Bajó la frecuencia · hace 5 días", "Medio"],
            ["Luis Martínez", "Dejó de venir · hace 9 días", "Alto"],
          ].map(([name, motivo, sev], i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 p-3 bg-[#1f1f22] border-b border-[rgba(72,71,74,0.12)] last:border-b-0"
            >
              <div className="min-w-0">
                <p className="text-[#f9f5f8] text-sm font-semibold">{name}</p>
                <p className="text-[#adaaad] text-xs">{motivo}</p>
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-[0.5px] px-2 py-1 rounded ${
                  sev === "Alto"
                    ? "text-[#ff4e8a] bg-[rgba(255,78,138,0.14)]"
                    : "text-[#ff8a5b] bg-[rgba(255,138,91,0.14)]"
                }`}
              >
                {sev}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Cohortes reales */}
      <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
        <h2 className="text-[#f9f5f8] font-black text-lg mb-1">
          Cohortes por mes de alta
        </h2>
        <p className="text-[#adaaad] text-xs mb-4">
          Cada fila sigue al grupo que se anotó ese mes. El guión (—) es un mes
          que todavía no transcurrió, no gente que se fue.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-1">
            <thead>
              <tr className="text-[#adaaad] text-[10px] uppercase tracking-[0.5px]">
                <th className="text-left font-bold px-1">Cohorte</th>
                <th className="text-left font-bold px-1">Socios</th>
                <th className="font-bold px-1">Mes 0</th>
                <th className="font-bold px-1">Mes 1</th>
                <th className="font-bold px-1">Mes 2</th>
                <th className="font-bold px-1">Mes 3</th>
              </tr>
            </thead>
            <tbody>
              {cohortRows.map((row, i) => (
                <tr key={i}>
                  <td className="text-[#f9f5f8] font-bold px-1">{row.label}</td>
                  <td className="text-[#adaaad] px-1">{row.size}</td>
                  {row.cells.map((v, k) => (
                    <td
                      key={k}
                      className="text-center rounded-md py-2 font-bold text-[#f9f5f8] text-xs"
                      style={
                        v === null
                          ? { color: "#5e5e67" }
                          : { backgroundColor: shade(v) as string }
                      }
                    >
                      {v === null ? "—" : `${v}%`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Referidos (ejemplo — depende del sistema de referidos) */}
      <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[#f9f5f8] font-black text-lg">Referidos</h2>
          <EjemploTag />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            ["Enviados", "96", "invitaciones"],
            ["Convertidos", "31", "alta ≤ 30 días"],
            ["Retenidos", "27", "activos +30 días"],
          ].map(([l, v, s], i) => (
            <div key={i} className="bg-[#1f1f22] rounded-xl p-3">
              <p className="text-[#adaaad] text-[10px] uppercase tracking-[0.5px]">{l}</p>
              <p className="text-[#f9f5f8] font-black text-xl mt-1">{v}</p>
              <p className="text-[#adaaad]/70 text-[10px]">{s}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#1f1f22] rounded-xl p-4 flex items-center gap-4">
          <p className="text-[#ff906d] font-black text-3xl">0.14</p>
          <p className="text-[#adaaad] text-xs">
            Coeficiente de referido (k) — cada socio activo trae, en promedio,
            0,14 socios nuevos por mes.
          </p>
        </div>
      </section>

      {/* Comparaciones vs control (ejemplo) */}
      <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[#f9f5f8] font-black text-lg">¿Está funcionando?</h2>
          <EjemploTag />
        </div>
        {[
          ["Enganchados con recompensas", 86, "Solo asisten", 64, "+22 pts"],
          ["Llegaron por referido", 87, "Otros canales", 68, "+19 pts"],
        ].map(([a, av, b, bv, delta], i) => (
          <div key={i} className="mb-4 last:mb-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#f9f5f8] font-semibold">{a as string}</span>
              <span className="text-[#ff906d] font-black">{av as number}%</span>
            </div>
            <div className="bg-[#262528] h-2 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full" style={{ width: `${av}%`, backgroundImage: GRAD }} />
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#adaaad]">{b as string}</span>
              <span className="text-[#adaaad] font-black">{bv as number}%</span>
            </div>
            <div className="bg-[#262528] h-2 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#adaaad]/40" style={{ width: `${bv}%` }} />
            </div>
            <p className="text-[#adaaad] text-[11px] mt-2">
              La capa de juego suma <span className="text-[#ff906d] font-bold">{delta as string}</span> de retención.
            </p>
          </div>
        ))}
      </section>

      {/* Definiciones */}
      <section className="bg-[#131315] border border-[rgba(72,71,74,0.1)] rounded-2xl p-5">
        <h2 className="text-[#f9f5f8] font-black text-lg mb-3">
          Cómo se calcula cada número
        </h2>
        <div className="flex flex-col gap-2 text-xs">
          <p className="text-[#adaaad]">
            <span className="text-[#f9f5f8] font-bold">Socio activo:</span> hizo
            al menos un check-in en los últimos {ACTIVE_WINDOW_DAYS} días.
          </p>
          <p className="text-[#adaaad]">
            <span className="text-[#f9f5f8] font-bold">Retención mensual:</span>{" "}
            de los activos del mes pasado, cuántos siguen activos este mes.
          </p>
          <p className="text-[#adaaad]">
            <span className="text-[#f9f5f8] font-bold">Cohorte:</span> grupo que
            se dio de alta en un mismo mes; se sigue su actividad mes a mes.
          </p>
        </div>
      </section>
    </div>
  );
}
