const cad = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

export const money = (n: number) => cad.format(n);

export const countdown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** True when a config value has actually been filled in. */
export const isSet = (v: string | null | undefined): v is string =>
  typeof v === "string" && v.trim() !== "" && v.trim().toUpperCase() !== "TBD";

/** 0 to 1, safe against a zero or missing goal. */
export const progress = (raised: number, goal: number) =>
  goal > 0 ? Math.min(1, Math.max(0, raised / goal)) : 0;
