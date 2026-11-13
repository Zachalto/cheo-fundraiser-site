import { useSyncExternalStore } from "react";

/** The site-wide 60 second clock. Starts when the page loads. */
export const CLOCK_SECONDS = 60;

let deadline = performance.now() + CLOCK_SECONDS * 1000;
let left = CLOCK_SECONDS;
let timer: number | undefined;
const listeners = new Set<() => void>();

function tick() {
  const next = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
  if (next !== left) {
    left = next;
    listeners.forEach((l) => l());
  }
  if (next === 0) stop();
}

function start() {
  if (timer === undefined && left > 0) timer = window.setInterval(tick, 200);
}

function stop() {
  window.clearInterval(timer);
  timer = undefined;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

export function restartClock() {
  deadline = performance.now() + CLOCK_SECONDS * 1000;
  left = CLOCK_SECONDS;
  listeners.forEach((l) => l());
  start();
}

export const useSecondsLeft = () => useSyncExternalStore(subscribe, () => left);
