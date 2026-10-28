export type Side = "LONG" | "SHORT";
export type Book = "ACTIONABLE" | "WATCH" | "REJECT";

export type Tag =
  | "monday-low"
  | "monday-high"
  | "fib75"
  | "with-trend"
  | "rsi-div"
  | "obv-div"
  | "dev-high"
  | "dev-low"
  | "wolf"
  | "breakout"
  | "dd";

export type CohortGroup = {
  id: string;
  label: string;
  side: Side;
  tags: Tag[];
  n: number;
  wins: number;
  totalR: number;
};

export type Verdict = {
  book: Book;
  code: string;
  note: string;
};
