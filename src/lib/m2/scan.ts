import { decide } from "./gate";
import type { Side, Tag, Verdict } from "./types";

type Snap = {
  symbol: string;
  px: number;
  btcBias: -1 | 0 | 1;
  pos: number;
  level: number;
  side: Side;
  tags: Tag[];
  confirm: "ok" | "wait" | "bad";
  tpAlreadyTraded: boolean;
  atr: number;
};

/** Struktur tertutup untuk papan contoh. Bukan harga live dan bukan order. */
const SNAP: Snap[] = [
  { symbol: "SOL", px: 178.4, btcBias: 1, pos: 0.22, level: 176.2, side: "LONG", tags: ["fib75", "with-trend", "obv-div"], confirm: "ok", tpAlreadyTraded: false, atr: 4.2 },
  { symbol: "ETH", px: 3240, btcBias: -1, pos: 0.78, level: 3288, side: "SHORT", tags: ["dev-high", "monday-high", "with-trend"], confirm: "ok", tpAlreadyTraded: false, atr: 62 },
  { symbol: "BTC", px: 67420, btcBias: 0, pos: 0.51, level: 66800, side: "LONG", tags: ["fib75"], confirm: "wait", tpAlreadyTraded: false, atr: 900 },
  { symbol: "AVAX", px: 28.4, btcBias: -1, pos: 0.18, level: 27.1, side: "LONG", tags: ["monday-low"], confirm: "ok", tpAlreadyTraded: false, atr: 0.7 },
  { symbol: "LINK", px: 14.8, btcBias: 1, pos: 0.2, level: 14.55, side: "LONG", tags: ["dev-low", "with-trend"], confirm: "ok", tpAlreadyTraded: false, atr: 0.35 },
  { symbol: "BNB", px: 612, btcBias: 1, pos: 0.84, level: 606, side: "SHORT", tags: ["wolf"], confirm: "ok", tpAlreadyTraded: false, atr: 9 },
  { symbol: "ADA", px: 0.62, btcBias: -1, pos: 0.8, level: 0.64, side: "SHORT", tags: ["fib75", "rsi-div", "with-trend"], confirm: "wait", tpAlreadyTraded: false, atr: 0.018 },
  { symbol: "TIA", px: 5.42, btcBias: -1, pos: 0.86, level: 5.55, side: "SHORT", tags: ["breakout", "with-trend"], confirm: "ok", tpAlreadyTraded: true, atr: 0.16 },
  { symbol: "INJ", px: 22.1, btcBias: 1, pos: 0.24, level: 21.4, side: "LONG", tags: ["dd", "rsi-div", "with-trend"], confirm: "ok", tpAlreadyTraded: false, atr: 0.55 },
  { symbol: "SUI", px: 2.18, btcBias: -1, pos: 0.73, level: 2.24, side: "SHORT", tags: ["monday-high", "with-trend"], confirm: "ok", tpAlreadyTraded: false, atr: 0.06 },
];

export type Plan = {
  symbol: string;
  side: Side;
  entry: number;
  sl: number;
  tp: number;
  mode: "limit" | "market";
  distPct: number;
  rr: number;
  slPct: number;
  tags: Tag[];
  verdict: Verdict;
};

function round(n: number) {
  if (n >= 100) return Math.round(n * 10) / 10;
  if (n >= 1) return Math.round(n * 100) / 100;
  return Math.round(n * 10000) / 10000;
}

export function scanBoard(): Plan[] {
  const counts: Record<Side, number> = { LONG: 0, SHORT: 0 };
  const plans: Plan[] = [];
  for (const s of SNAP) {
    const level = s.level;
    const chased = s.side === "LONG" ? s.px < level : s.px > level;
    const mode = chased ? "market" : "limit";
    const entry = mode === "market" ? s.px : level;
    const slDist = Math.max(s.atr * 0.8, entry * 0.01);
    const sl = s.side === "LONG" ? entry - slDist : entry + slDist;
    const risk = Math.abs(entry - sl);
    const tp = s.side === "LONG" ? entry + 2 * risk : entry - 2 * risk;
    const distPct = (Math.abs(s.px - entry) / s.px) * 100;
    const slPct = (risk / entry) * 100;
    const rr = risk > 0 ? Math.abs(tp - entry) / risk : 0;
    const location = s.pos > 0.35 && s.pos < 0.65 ? "mid" : "extreme";
    const verdict = decide({
      symbol: s.symbol,
      side: s.side,
      tags: s.tags,
      btcBias: s.btcBias,
      confirm: s.confirm,
      tpAlreadyTraded: s.tpAlreadyTraded,
      mode,
      distPct: mode === "market" ? 1 : distPct,
      rr,
      slPct,
      location,
      sameDirectionToday: counts[s.side],
    });
    if (verdict.book === "ACTIONABLE") counts[s.side] += 1;
    plans.push({
      symbol: s.symbol,
      side: s.side,
      entry: round(entry),
      sl: round(sl),
      tp: round(tp),
      mode,
      distPct,
      rr,
      slPct,
      tags: s.tags,
      verdict,
    });
  }
  return plans;
}
