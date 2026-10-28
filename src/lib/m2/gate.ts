import type { Side, Tag, Verdict } from "./types";

/** Aturan Mesin 2 v2.0.0 — dikunci sebelum angka ulang dipakai sebagai bukti. */
export const RULES = {
  version: "m2-2.1.0",
  minRr: 1.5,
  minSlPct: 0.6,
  maxSlPct: 8,
  minDistPct: 0.15,
  maxDistPct: 2.5,
  maxSameDirection: 3,
} as const;

export type GateInput = {
  symbol: string;
  side: Side;
  tags: Tag[];
  btcBias: -1 | 0 | 1;
  confirm: "ok" | "wait" | "bad";
  tpAlreadyTraded: boolean;
  mode: "limit" | "market";
  distPct: number;
  rr: number;
  slPct: number;
  location: "extreme" | "mid";
  sameDirectionToday: number;
};

const TAG_LABEL: Record<Tag, string> = {
  "monday-low": "Sweep Monday Low lalu reclaim",
  "monday-high": "Sweep Monday High lalu reclaim",
  fib75: "Fib 0.75",
  "with-trend": "searah tren",
  "rsi-div": "RSI divergence",
  "obv-div": "OBV divergence",
  "dev-high": "deviasi atas gagal bertahan",
  "dev-low": "deviasi bawah lalu recovery",
  wolf: "Wolf",
  breakout: "breakout / breakdown ber-close",
  dd: "Double Deviation",
};

export function tagLabel(tag: Tag) {
  return TAG_LABEL[tag];
}

function hasConfluence(tags: Tag[]) {
  const core = tags.filter((t) => t !== "with-trend" && t !== "rsi-div" && t !== "obv-div");
  const div = tags.includes("rsi-div") || tags.includes("obv-div");
  const withTrend = tags.includes("with-trend");
  if (core.length >= 2) return true;
  if (core.length === 1 && (div || withTrend)) return true;
  return false;
}

export function decide(input: GateInput): Verdict {
  const symbol = input.symbol.trim().toUpperCase();
  if (!/^[A-Z0-9]{2,20}$/.test(symbol)) {
    return { book: "REJECT", code: "MISSING_SYMBOL", note: "Simbol kosong atau tidak valid. Tidak masuk jurnal." };
  }
  if (input.tpAlreadyTraded) {
    return {
      book: "REJECT",
      code: "STALE_TP_ALREADY_TRADED",
      note: "TP sudah tercetak sebelum waktu keputusan. Bukan EXPIRED — setup tidak diterbitkan.",
    };
  }
  if (input.confirm === "bad") {
    return { book: "REJECT", code: "INVALIDATED", note: "Close sudah menembus invalidation. Tidak diterbitkan." };
  }
  if (input.rr < RULES.minRr) {
    return { book: "REJECT", code: "RR_BELOW_MIN", note: `RR rencana ${input.rr.toFixed(2)} di bawah ${RULES.minRr} setelah biaya.` };
  }
  if (input.slPct < RULES.minSlPct || input.slPct > RULES.maxSlPct) {
    return {
      book: "REJECT",
      code: "SL_OUT_OF_BAND",
      note: `Jarak SL ${input.slPct.toFixed(1)}% di luar pita ${RULES.minSlPct}–${RULES.maxSlPct}%. Buku lebar tidak diskor.`,
    };
  }
  if (input.mode === "limit" && (input.distPct < RULES.minDistPct || input.distPct > RULES.maxDistPct)) {
    return {
      book: "REJECT",
      code: "DISTANCE",
      note: "Limit di luar pita 0,15–2,5% dari harga keputusan, atau harga sudah mengejar level.",
    };
  }
  if (input.tags.includes("monday-low") && !input.tags.includes("with-trend")) {
    return {
      book: "REJECT",
      code: "MONDAY_LOW_OFF",
      note: "Monday Low tanpa tren dimatikan. Oktober: 28 trade polos, 0 menang, −28 R.",
    };
  }
  if (input.tags.includes("monday-low") && input.tags.filter((t) => t !== "with-trend" && t !== "rsi-div" && t !== "obv-div").length < 2) {
    return {
      book: "REJECT",
      code: "MONDAY_LOW_THIN",
      note: "Monday Low butuh dua struktur lain, bukan hanya divergensi. Pola ini yang merusak buku LONG.",
    };
  }
  if (input.tags.length === 1 && input.tags[0] === "wolf") {
    return { book: "REJECT", code: "WOLF_BARE", note: "Wolf tanpa konfluensi lain dimatikan." };
  }
  if (input.location === "mid" && !input.tags.includes("dd") && !input.tags.includes("dev-high") && !input.tags.includes("dev-low")) {
    return { book: "WATCH", code: "MID_RANGE", note: "Harga di tengah range. Tidak ada setup — tunggu ekstrem." };
  }
  if (input.confirm === "wait") {
    return { book: "WATCH", code: "UNCONFIRMED", note: "Level menarik, belum ada close konfirmasi. Tidak bisa terisi." };
  }
  if (input.side === "LONG" && input.btcBias < 0) {
    return { book: "REJECT", code: "LONG_VS_BTC", note: "LONG ditolak saat bias harian BTC turun." };
  }
  if (input.side === "SHORT" && input.btcBias > 0) {
    return { book: "REJECT", code: "SHORT_VS_BTC", note: "SHORT ditolak saat bias harian BTC naik." };
  }
  if (!hasConfluence(input.tags)) {
    return {
      book: "WATCH",
      code: "NEEDS_CONFLUENCE",
      note: "Satu pemicu mentah. Tunggu konfluensi: searah tren, divergensi, atau struktur kedua.",
    };
  }
  if (input.sameDirectionToday >= RULES.maxSameDirection) {
    return {
      book: "REJECT",
      code: "CORRELATION_CAP",
      note: `Sudah ${RULES.maxSameDirection} ${input.side} hari ini. Batch searah tidak menambah observasi.`,
    };
  }
  return {
    book: "ACTIONABLE",
    code: "PASS",
    note: `${input.side} konfluen, searah bias, TP belum basi, RR cukup. Bukan izin uang real.`,
  };
}

/** Replay agregat Oktober: hanya filter yang terbaca dari alasan entry. */
export function replayGroup(side: Side, tags: Tag[]): Verdict {
  return decide({
    symbol: "REPLAY",
    side,
    tags,
    btcBias: 0,
    confirm: "ok",
    tpAlreadyTraded: false,
    mode: "market",
    distPct: 1,
    rr: 2,
    slPct: 3,
    location: "extreme",
    sameDirectionToday: 0,
  });
}
