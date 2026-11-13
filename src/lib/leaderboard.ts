import { event } from "../config/event";
import { isSet } from "./format";

/*
 * Shared leaderboard, stored in a Supabase table called "scores".
 * The site talks to it with plain web requests, so there is no extra library to download.
 * Setup steps are in the README and supabase/leaderboard.sql.
 */

export interface Row {
  name: string;
  score: number;
}

const cfg = event.leaderboard;

/** False until the Supabase address and key are filled in in the config file. */
export const leaderboardOn = isSet(cfg.supabaseUrl) && isSet(cfg.supabaseKey);

export const NAME_MIN = 2;
export const NAME_MAX = 14;
export const SHOWN = 10;

// Keep this list in step with the one in supabase/leaderboard.sql.
const BLOCKED = [
  "fuck", "shit", "bitch", "cunt", "dick", "cock", "pussy", "penis", "vagina", "whore", "slut",
  "asshole", "nigg", "fag", "rape", "nazi", "porn", "sex", "kys",
];

export type NameCheck = { ok: true; name: string } | { ok: false; reason: string };

export function checkName(raw: string): NameCheck {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < NAME_MIN) return { ok: false, reason: `Type at least ${NAME_MIN} letters.` };
  if (name.length > NAME_MAX) return { ok: false, reason: `Keep it to ${NAME_MAX} characters.` };
  if (!/^[A-Za-z0-9 ._-]+$/.test(name)) return { ok: false, reason: "Letters, numbers and spaces only." };
  const squashed = name.toLowerCase().replace(/[^a-z]/g, "");
  if (BLOCKED.some((w) => squashed.includes(w))) return { ok: false, reason: "Pick a different name." };
  return { ok: true, name };
}

function headers(): Record<string, string> {
  const key = cfg.supabaseKey ?? "";
  const h: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  // Older Supabase keys are long tokens starting with "eyJ" and also go in this second header.
  if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
  return h;
}

const endpoint = () => `${(cfg.supabaseUrl ?? "").replace(/\/+$/, "")}/rest/v1/scores`;

/** The top scores, one row per name (their best). */
export async function fetchTop(): Promise<Row[]> {
  const res = await fetch(`${endpoint()}?select=name,score&order=score.desc,created_at.asc&limit=300`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Leaderboard read failed (${res.status})`);
  const rows = (await res.json()) as Row[];
  const seen = new Set<string>();
  const best: Row[] = [];
  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    best.push(row);
    if (best.length === SHOWN) break;
  }
  return best;
}

export async function postScore(name: string, score: number): Promise<void> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify({ name, score }),
  });
  if (!res.ok) throw new Error(`Leaderboard post failed (${res.status})`);
}

const NAME_KEY = "cup-stack-name";

export function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* storage blocked: they just retype it next time */
  }
}
