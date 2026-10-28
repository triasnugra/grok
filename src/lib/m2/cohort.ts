import type { CohortGroup } from "./types";

/**
 * Trade terisi Mesin 2, agregat Excel 27 Okt 2026.
 * n dan total R adalah angka monitor, bukan trade fiktif per koin.
 */
export const COHORT: CohortGroup[] = [
  { id: "dd-rsi", label: "Double Deviation, tekanan beli melemah, RSI divergence", side: "SHORT", tags: ["dd", "rsi-div"], n: 1, wins: 0, totalR: -1 },
  { id: "fib-rsi-trend", label: "Fib 0.75 tren turun, RSI divergence, searah tren", side: "SHORT", tags: ["fib75", "rsi-div", "with-trend"], n: 1, wins: 1, totalR: 2 },
  { id: "fib-trend", label: "Fib 0.75 tren turun, searah tren", side: "SHORT", tags: ["fib75", "with-trend"], n: 6, wins: 3, totalR: 3 },
  { id: "wolf-bull-trend", label: "Wolf bullish, searah tren", side: "LONG", tags: ["wolf", "with-trend"], n: 1, wins: 1, totalR: 2 },
  { id: "wolf-bull", label: "Wolf bullish tanpa konfluensi", side: "LONG", tags: ["wolf"], n: 2, wins: 0, totalR: -2 },
  { id: "wolf-fail", label: "Wolf: breakout trendline gagal", side: "SHORT", tags: ["wolf"], n: 1, wins: 0, totalR: -1 },
  { id: "bo-trend", label: "Breakout ber-close, retest, searah tren", side: "LONG", tags: ["breakout", "with-trend"], n: 1, wins: 0, totalR: -1 },
  { id: "dev-fib", label: "Deviasi atas gagal, Fib 0.75 turun, RSI, searah tren", side: "SHORT", tags: ["dev-high", "fib75", "rsi-div", "with-trend"], n: 1, wins: 1, totalR: 2 },
  { id: "dev-rsi", label: "Deviasi atas gagal, RSI divergence", side: "SHORT", tags: ["dev-high", "rsi-div"], n: 1, wins: 1, totalR: 2 },
  { id: "dev-mon-fib", label: "Deviasi atas + Monday High + Fib turun + RSI + tren", side: "SHORT", tags: ["dev-high", "monday-high", "fib75", "rsi-div", "with-trend"], n: 1, wins: 0, totalR: -1 },
  { id: "dev-bare", label: "Deviasi atas gagal bertahan", side: "SHORT", tags: ["dev-high"], n: 1, wins: 1, totalR: 2 },
  { id: "dev-low", label: "Deviasi bawah lalu recovery", side: "LONG", tags: ["dev-low"], n: 1, wins: 0, totalR: -1 },
  { id: "mh-rsi-trend", label: "Monday High reclaim, RSI divergence, searah tren", side: "SHORT", tags: ["monday-high", "rsi-div", "with-trend"], n: 1, wins: 1, totalR: 2 },
  { id: "mh-wolf", label: "Monday High reclaim + Wolf gagal", side: "SHORT", tags: ["monday-high", "wolf"], n: 1, wins: 1, totalR: 2 },
  { id: "mh-trend", label: "Monday High reclaim, searah tren", side: "SHORT", tags: ["monday-high", "with-trend"], n: 2, wins: 2, totalR: 4 },
  { id: "mh-bare", label: "Monday High reclaim", side: "SHORT", tags: ["monday-high"], n: 3, wins: 1, totalR: 0 },
  { id: "ml-obv-trend", label: "Monday Low reclaim, OBV divergence, searah tren", side: "LONG", tags: ["monday-low", "obv-div", "with-trend"], n: 2, wins: 1, totalR: 1 },
  { id: "ml-obv", label: "Monday Low reclaim, OBV divergence", side: "LONG", tags: ["monday-low", "obv-div"], n: 2, wins: 0, totalR: -2 },
  { id: "ml-rsi", label: "Monday Low reclaim, RSI divergence", side: "LONG", tags: ["monday-low", "rsi-div"], n: 1, wins: 0, totalR: -1 },
  { id: "ml-wolf-trend", label: "Monday Low reclaim, Wolf bullish, searah tren", side: "LONG", tags: ["monday-low", "wolf", "with-trend"], n: 2, wins: 0, totalR: -2 },
  { id: "ml-trend", label: "Monday Low reclaim, searah tren", side: "LONG", tags: ["monday-low", "with-trend"], n: 1, wins: 0, totalR: -1 },
  { id: "ml-bare", label: "Monday Low reclaim", side: "LONG", tags: ["monday-low"], n: 28, wins: 0, totalR: -28 },
];

export const DAILY = [
  { day: "15", r: -13 },
  { day: "17", r: 2 },
  { day: "18", r: 1 },
  { day: "19", r: -7 },
  { day: "20", r: 1 },
  { day: "21", r: -2 },
  { day: "22", r: 3 },
  { day: "23", r: -2 },
  { day: "24", r: -1 },
  { day: "26", r: -1 },
];

export const LEGACY = {
  published: 228,
  triggered: 79,
  tp: 14,
  sl: 47,
  expired: 125,
  pending: 42,
  expectancy: -0.31,
  totalR: -19,
};
