import { COHORT } from "./cohort";
import { replayGroup } from "./gate";
import type { Book, CohortGroup } from "./types";

export type Scored = CohortGroup & {
  book: Book;
  code: string;
  note: string;
};

export function scoreCohort(): Scored[] {
  return COHORT.map((g) => {
    const v = replayGroup(g.side, g.tags);
    return { ...g, book: v.book, code: v.code, note: v.note };
  });
}

export function sumBook(rows: Scored[], book: Book) {
  const list = rows.filter((r) => r.book === book);
  const n = list.reduce((a, r) => a + r.n, 0);
  const wins = list.reduce((a, r) => a + r.wins, 0);
  const totalR = list.reduce((a, r) => a + r.totalR, 0);
  return {
    groups: list.length,
    n,
    wins,
    losses: n - wins,
    totalR,
    winRate: n ? wins / n : null,
    expectancy: n ? totalR / n : null,
  };
}
