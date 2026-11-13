import { Cup } from "./Cup";

const ROWS = [4, 3, 2, 1];
const STEP_X = 60;
const STEP_Y = 62;

/** Illustrated cup pyramid. Stands in for the 3D scene, and is its fallback later. */
export function StaticHero() {
  const cups: { x: number; y: number }[] = [];
  ROWS.forEach((count, row) => {
    const startX = 40 + (row * STEP_X) / 2;
    const y = 200 - row * STEP_Y;
    for (let i = 0; i < count; i++) cups.push({ x: startX + i * STEP_X, y });
  });

  return (
    <svg
      className="static-hero"
      viewBox="0 0 320 300"
      role="img"
      aria-label="A pyramid of ten red party cups on a table, with a ping pong ball beside it."
    >
      <ellipse cx="160" cy="272" rx="150" ry="14" fill="var(--ink)" opacity=".12" />
      {cups.map((c, i) => (
        <Cup key={i} x={c.x} y={c.y} />
      ))}
      <rect x="6" y="268" width="308" height="12" rx="4" fill="var(--ink)" />
      <circle cx="292" cy="256" r="11" fill="#fff" stroke="var(--ink)" strokeWidth="2.5" />
    </svg>
  );
}
