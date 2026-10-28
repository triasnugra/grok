import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SignalJournal } from "@/components/journal";
import { DAILY, LEGACY } from "@/lib/m2/cohort";
import { scanBoard } from "@/lib/m2/scan";
import { RULES, decide, tagLabel } from "@/lib/m2/gate";
import { scoreCohort, sumBook } from "@/lib/m2/replay";
import type { Book, Side, Tag } from "@/lib/m2/types";

const TAGS: Tag[] = [
  "monday-low",
  "monday-high",
  "fib75",
  "with-trend",
  "rsi-div",
  "obv-div",
  "dev-high",
  "dev-low",
  "wolf",
  "breakout",
  "dd",
];

const TABS: { id: Book | "ALL"; label: string }[] = [
  { id: "ALL", label: "Semua grup" },
  { id: "ACTIONABLE", label: "Buku skor" },
  { id: "WATCH", label: "Watch" },
  { id: "REJECT", label: "Ditolak" },
];

function pct(n: number | null) {
  if (n == null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function rtxt(n: number | null) {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)} R`;
}

export function Desk() {
  const rows = useMemo(() => scoreCohort(), []);
  const kept = sumBook(rows, "ACTIONABLE");
  const watch = sumBook(rows, "WATCH");
  const rejected = sumBook(rows, "REJECT");
  const [tab, setTab] = useState<Book | "ALL">("ACTIONABLE");
  const visible = tab === "ALL" ? rows : rows.filter((r) => r.book === tab);

  const [symbol, setSymbol] = useState("SOL");
  const [side, setSide] = useState<Side>("SHORT");
  const [btcBias, setBtcBias] = useState<-1 | 0 | 1>(-1);
  const [confirm, setConfirm] = useState<"ok" | "wait" | "bad">("ok");
  const [stale, setStale] = useState(false);
  const [mode, setMode] = useState<"limit" | "market">("limit");
  const [dist, setDist] = useState(0.8);
  const [rr, setRr] = useState(2);
  const [sl, setSl] = useState(3);
  const [batch, setBatch] = useState(0);
  const [location, setLocation] = useState<"extreme" | "mid">("extreme");
  const [tags, setTags] = useState<Tag[]>(["fib75", "with-trend"]);
  const board = useMemo(() => scanBoard(), []);
  const live = board.filter((p) => p.verdict.book === "ACTIONABLE");
  const liveWatch = board.filter((p) => p.verdict.book === "WATCH");
  const liveReject = board.filter((p) => p.verdict.book === "REJECT");

  const verdict = decide({
    symbol,
    side,
    tags,
    btcBias,
    confirm,
    tpAlreadyTraded: stale,
    mode,
    distPct: dist,
    rr,
    slPct: sl,
    location,
    sameDirectionToday: batch,
  });

  function toggle(tag: Tag) {
    setTags((cur) => (cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag]));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="num text-xs tracking-widest text-primary">MESIN · {RULES.version}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Analisis LONG dan SHORT</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Kedua arah diterbitkan hanya di ekstrem, searah bias BTC, dan dengan konfluensi. Monday Low polos, Wolf polos, dan setup yang TP-nya sudah kena tidak masuk.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <a href="#jurnal" className="rounded-full bg-surface-2 px-4 py-2 text-sm text-fg">
            Jurnal
          </a>
          <p className="num text-xs text-muted">Legacy 14 TP / 47 SL · −0,31 R</p>
        </div>
      </header>

      <div className="mb-6 rounded-xl border border-danger/40 bg-surface px-4 py-3 text-sm">
        <p className="font-medium text-danger">Belum ada edge. Jangan pakai uang real.</p>
        <p className="mt-1 text-muted">
          Angka “setelah gerbang” adalah saringan pada trade yang sama (in-sample). Itu menunjukkan kebocoran yang terpotong, bukan bukti strategi baru.
          Forward test baru mulai dari nol: 150 trade terisi dan 20 minggu, CI expectancy bersih di atas nol.
        </p>
      </div>

      <section className="mb-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-sm font-medium">Papan keputusan</h2>
          <p className="text-xs text-muted">
            {live.length} siap · {liveWatch.length} watch · {liveReject.length} ditolak
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {board.map((p) => (
            <article key={p.symbol} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="num text-lg">{p.symbol}</p>
                  <p className={`text-sm font-medium ${p.side === "LONG" ? "text-primary" : "text-danger"}`}>{p.side}</p>
                </div>
                <p className={`num text-xs ${p.verdict.book === "ACTIONABLE" ? "text-primary" : p.verdict.book === "WATCH" ? "text-warn" : "text-danger"}`}>
                  {p.verdict.book}
                </p>
              </div>
              <p className="num mt-2 text-xs text-muted">
                {p.mode} · entry {p.entry} · SL {p.sl} · TP {p.tp}
              </p>
              <p className="mt-2 text-sm text-muted">{p.verdict.note}</p>
              <p className="mt-2 text-xs text-muted">{p.tags.map(tagLabel).join(" · ")}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat k="Legacy terisi" v="23,0%" s="61 trade · −19 R" />
        <Stat k="Buku skor v2" v={pct(kept.winRate)} s={`${kept.n} trade · ${rtxt(kept.totalR)} · ${rtxt(kept.expectancy)}`} hot />
        <Stat k="Tidak diskor" v={`${rejected.n + watch.n}`} s={`Tolak ${rejected.n} · Watch ${watch.n} · ${rtxt(rejected.totalR + watch.totalR)} di luar buku`} />
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-surface p-4 lg:col-span-3">
          <h2 className="mb-3 text-sm font-medium">R harian legacy, Oktober</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DAILY}>
                <XAxis dataKey="day" tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-2)" }}
                  contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  labelFormatter={(d) => `Okt ${d}`}
                />
                <Bar dataKey="r" radius={[4, 4, 0, 0]}>
                  {DAILY.map((d) => (
                    <Cell key={d.day} fill={d.r >= 0 ? "var(--color-primary)" : "var(--color-danger)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted">19 Okt tidak separah Mesin 1, tapi 15 Okt −13 R: satu hari, banyak SHORT/LONG yang bergerak bareng.</p>
        </div>
        <ul className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm lg:col-span-2">
          <li className="font-medium">Yang berubah</li>
          <li className="text-muted">LONG dan SHORT sama-sama boleh. LONG mati hanya jika BTC turun; SHORT mati hanya jika BTC naik.</li>
          <li className="text-muted">Monday Low tanpa dua struktur lain tetap mati. Itu sumber −28 R, bukan arah LONG-nya.</li>
          <li className="text-muted">Tengah range = Watch. Satu pemicu tanpa tren atau divergensi = Watch.</li>
          <li className="text-muted">Maks {RULES.maxSameDirection} setup searah per hari. TP yang sudah kena sebelum keputusan ditolak, bukan dilabel EXPIRED.</li>
          <li className="text-muted">EXPIRED legacy {LEGACY.expired} dan pending {LEGACY.pending} tidak masuk win rate, sama seperti monitor.</li>
        </ul>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${tab === t.id ? "bg-primary text-primary-fg" : "bg-surface-2 text-fg"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-2 text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Alasan</th>
                <th className="px-3 py-2 font-medium">Arah</th>
                <th className="px-3 py-2 font-medium">n</th>
                <th className="px-3 py-2 font-medium">Win</th>
                <th className="px-3 py-2 font-medium">Total R</th>
                <th className="px-3 py-2 font-medium">v2</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">{r.label}</td>
                  <td className="num px-3 py-2">{r.side}</td>
                  <td className="num px-3 py-2">{r.n}</td>
                  <td className="num px-3 py-2">{r.n ? `${Math.round((r.wins / r.n) * 100)}%` : "—"}</td>
                  <td className={`num px-3 py-2 ${r.totalR < 0 ? "text-danger" : "text-primary"}`}>{rtxt(r.totalR)}</td>
                  <td className="px-3 py-2">
                    <span className="num text-xs">{r.code}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <form className="rounded-xl border border-border bg-surface p-4" onSubmit={(e) => e.preventDefault()}>
          <h2 className="mb-3 text-sm font-medium">Uji gerbang pada setup baru</h2>
          <label className="mb-3 block text-sm">
            <span className="text-muted">Simbol</span>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
            />
          </label>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Select label="Arah" value={side} onChange={(v) => setSide(v as Side)} options={["SHORT", "LONG"]} />
            <Select
              label="Bias BTC"
              value={String(btcBias)}
              onChange={(v) => setBtcBias(Number(v) as -1 | 0 | 1)}
              options={["-1", "0", "1"]}
              labels={["Turun", "Datar", "Naik"]}
            />
            <Select label="Konfirmasi" value={confirm} onChange={(v) => setConfirm(v as "ok" | "wait" | "bad")} options={["ok", "wait", "bad"]} />
            <Select label="Mode" value={mode} onChange={(v) => setMode(v as "limit" | "market")} options={["limit", "market"]} />
            <Select
              label="Posisi di range"
              value={location}
              onChange={(v) => setLocation(v as "extreme" | "mid")}
              options={["extreme", "mid"]}
              labels={["Ekstrem", "Tengah"]}
            />
          </div>
          <Slider label={`Jarak entry ${dist.toFixed(2)}%`} min={0} max={6} step={0.05} value={dist} onChange={setDist} />
          <Slider label={`RR rencana ${rr.toFixed(1)}`} min={0.5} max={4} step={0.1} value={rr} onChange={setRr} />
          <Slider label={`SL ${sl.toFixed(1)}%`} min={0.2} max={20} step={0.1} value={sl} onChange={setSl} />
          <Slider label={`SHORT lain hari ini: ${batch}`} min={0} max={8} step={1} value={batch} onChange={setBatch} />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={stale} onChange={(e) => setStale(e.target.checked)} />
            TP sudah kena sebelum waktu keputusan
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                className={`rounded-full px-3 py-1.5 text-xs ${tags.includes(tag) ? "bg-primary text-primary-fg" : "bg-surface-2 text-fg"}`}
              >
                {tagLabel(tag)}
              </button>
            ))}
          </div>
        </form>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Keputusan</p>
          <p className={`mt-1 text-xl font-semibold ${verdict.book === "ACTIONABLE" ? "text-primary" : verdict.book === "WATCH" ? "text-warn" : "text-danger"}`}>
            {verdict.book}
          </p>
          <p className="num mt-1 text-sm">{verdict.code}</p>
          <p className="mt-3 text-sm text-muted">{verdict.note}</p>
          <p className="mt-6 text-xs text-muted">
            Kartu hanya boleh menulis Entry limit bila mode limit. Market menghitung ulang TP dari harga keputusan — TP lama yang sudah tembus tidak dibawa.
          </p>
        </div>
      </section>
      <section id="jurnal" className="mt-10 scroll-mt-6 border-t border-border pt-8">
        <SignalJournal />
      </section>
    </main>
  );
}

function Stat({ k, v, s, hot }: { k: string; v: string; s: string; hot?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${hot ? "border-primary bg-surface" : "border-border bg-surface"}`}>
      <p className="text-xs text-muted">{k}</p>
      <p className="num mt-1 text-2xl">{v}</p>
      <p className="mt-1 text-xs text-muted">{s}</p>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: string[];
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
      >
        {options.map((o, i) => (
          <option key={o} value={o}>
            {labels?.[i] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="mb-2 block text-sm">
      <span className="text-muted">{label}</span>
      <input
        className="mt-1 w-full accent-primary"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
