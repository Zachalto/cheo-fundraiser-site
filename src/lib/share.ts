import { event } from "../config/event";
import { isSet } from "./format";

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

export const siteUrl = () => (isSet(event.siteUrl) ? event.siteUrl : location.origin + location.pathname);

/** Opens the phone's share sheet. Falls back to copying the link. */
export async function share(text: string): Promise<ShareResult> {
  const url = siteUrl();
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: event.name, text, url });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}

const BEST_KEY = "cup-stack-best";

export function loadBest(): number {
  try {
    const n = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveBest(score: number) {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    /* private mode or storage blocked: the game still works, it just forgets */
  }
}
