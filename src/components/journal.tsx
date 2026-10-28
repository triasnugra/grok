import { useMemo, useState } from "react";
import { COHORT, LEGACY } from "@/lib/m2/cohort";
import type { Side } from "@/lib/m2/types";

const FILLED = LEGACY.tp + LEGACY.sl;
const FORWARD_TRADES = 150;
const FORWARD_WEEKS = 20;

type HasilKind = "TP" | "SL" | "campuran";

type Row = {
  id: string;
  waktu: string;
  aset: string;
  arah: Side;
  entry: null;
  sl: null;
  tp: null;
  hasil: HasilKind;
  hasilLabel: string;
  n: number;
  R: number;
  alasan: string;
};

const ROWS: Row[] = COHORT.map((g) => {
  const losses = g.n - g.wins;
  const hasil: HasilKind = g.wins === g.n ? "TP" : g.wins === 0 ? "SL" : "campuran";
  const hasilLabel = g.n === 1 ? (g.wins ? "TP" : "SL") : `${g.wins} TP · ${losses} SL`;
  return {
    id: g.id,
    waktu: "Okt 2026",
    aset: "—",
    arah: g.side,
    entry: null,
    sl: null,
    tp: null,
    hasil,
    hasilLabel,
    n: g.n,
    R: g.totalR,
    alasan: g.label,
  };
});

const FILTERS: { id: "all" | HasilKind; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "TP", label: "TP" },
  { id: "SL", label: "SL" },
  { id: "campuran", label: "Campuran" },
];

function hasilClass(h: HasilKind) {
  if (h === "TP") return "text-primary";
  if (h === "SL") return "text-danger";
  return "text-warn";
}

function rtxt(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}`;
}

export function SignalJournal() {
  const [hasil, setHasil] = useState<"all" | HasilKind>("all");
  const [side, setSide] = useState<"all" | Side>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ROWS.filter((r) => {
      if (hasil !== "all" && r.hasil !== hasil) return false;
      if (side !== "all" && r.arah !== side) return false;
      if (!q) return true;
      return r.alasan.toLowerCase().includes(q) || r.arah.toLowerCase().includes(q);
    });
  }, [hasil, query, side]);

  const win = `${((LEGACY.tp / FILLED) * 100).toFixed(1)}%`;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Jurnal sinyal</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Angka legacy mesin ini, agregat 27 Okt 2026. Win rate = TP ÷ (TP + SL). EXPIRED {LEGACY.expired} dan pending {LEGACY.pending} tidak masuk win rate. Rata-rata R dan total R dari {FILLED} trade terisi.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric k="Sinyal" v={String(LEGACY.published)} s={`${FILLED} terisi`} />
        <Metric k="Win rate" v={win} s={`${LEGACY.tp} TP · ${LEGACY.sl} SL`} />
        <Metric k="Rata-rata R" v={LEGACY.expectancy.toFixed(2)} tone="bad" />
        <Metric k="Total R" v={String(LEGACY.totalR)} tone="bad" />
      </div>

      <div className="mb-4 rounded-xl border border-warn/50 bg-surface p-4">
        <p className="text-sm font-medium">
          Forward test <span className="font-normal text-muted">(uji bersih, mulai dari nol)</span>
        </p>
        <p className="num mt-2 text-sm">
          Trade terisi 0/{FORWARD_TRADES} · minggu 0/{FORWARD_WEEKS} · menunggu 0
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Meter label="Trade terisi" a={0} b={FORWARD_TRADES} />
          <Meter label="Minggu berbeda" a={0} b={FORWARD_WEEKS} />
        </div>
        <p className="mt-3 text-sm text-muted">
          Angka kinerja forward test disembunyikan sampai syarat terpenuhi, agar aturan tidak diubah di tengah jalan.
        </p>
      </div>

      <p className="mb-3 text-sm text-muted">
        Tabel ini kelompok alasan, bukan trade per koin. Aset, entry, SL, dan TP tidak tersimpan di mesin, jadi dikosongkan. R adalah total R kelompok.
      </p>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setHasil(f.id)}
              className={`rounded-full px-3 py-2 text-sm ${hasil === f.id ? "bg-primary text-primary-fg" : "bg-surface-2 text-fg"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "LONG", "SHORT"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={`rounded-full px-3 py-2 text-sm ${side === s ? "bg-surface-2 text-fg ring-1 ring-border" : "bg-surface text-muted"}`}
            >
              {s === "all" ? "Dua arah" : s}
            </button>
          ))}
        </div>
      </div>

      <label className="mb-3 block text-sm">
        <span className="text-muted">Cari alasan</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Monday Low, Fib, Wolf…"
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
        />
      </label>
      <p className="mb-2 text-xs text-muted">
        {rows.length} dari {ROWS.length} kelompok · {rows.reduce((a, r) => a + r.n, 0)} trade
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-surface-2 text-muted">
            <tr>
              {["waktu", "aset", "arah", "entry", "sl", "tp", "hasil", "R", "alasan"].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-muted">
                  Tidak ada kelompok untuk saringan ini.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="num whitespace-nowrap px-3 py-2 text-xs">{r.waktu}</td>
                  <td className="px-3 py-2 text-muted">{r.aset}</td>
                  <td className={`num px-3 py-2 ${r.arah === "LONG" ? "text-primary" : "text-danger"}`}>{r.arah}</td>
                  <td className="px-3 py-2 text-muted">—</td>
                  <td className="px-3 py-2 text-muted">—</td>
                  <td className="px-3 py-2 text-muted">—</td>
                  <td className={`px-3 py-2 ${hasilClass(r.hasil)}`}>{r.hasilLabel}</td>
                  <td className={`num px-3 py-2 ${r.R < 0 ? "text-danger" : r.R > 0 ? "text-primary" : "text-muted"}`}>{rtxt(r.R)}</td>
                  <td className="max-w-xs px-3 py-2 text-muted">{r.alasan}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ k, v, s, tone }: { k: string; v: string; s?: string; tone?: "bad" }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{k}</p>
      <p className={`num mt-1 text-2xl ${tone === "bad" ? "text-danger" : "text-fg"}`}>{v}</p>
      {s ? <p className="mt-1 text-xs text-muted">{s}</p> : null}
    </div>
  );
}

function Meter({ label, a, b }: { label: string; a: number; b: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((a / b) * 100)));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="num">
          {a}/{b}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`${label} ${a} dari ${b}`}>
        <div className="h-full bg-warn" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
