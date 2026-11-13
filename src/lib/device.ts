export const prefersReducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

interface NetworkInfo {
  saveData?: boolean;
  effectiveType?: string;
}

/** For testing: add ?3d=on or ?3d=off to the address. */
export function forced3D(): "on" | "off" | null {
  const v = new URLSearchParams(location.search).get("3d");
  return v === "on" || v === "off" ? v : null;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const opts = { failIfMajorPerformanceCaveat: true };
    return !!(canvas.getContext("webgl2", opts) || canvas.getContext("webgl", opts));
  } catch {
    return false;
  }
}

/** A weak phone, a slow connection, or data saver. Used to skip the 3D and calm the page down. */
export function isLowPower(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: NetworkInfo };
  if (nav.connection?.saveData) return true;
  if (nav.connection?.effectiveType && /(^|-)(2g|3g)$/.test(nav.connection.effectiveType)) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return true;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 4) return true;
  return false;
}

export function canRun3D(): boolean {
  const force = forced3D();
  if (force === "off") return false;
  if (force === "on") return true;
  return !prefersReducedMotion() && !isLowPower() && hasWebGL();
}
