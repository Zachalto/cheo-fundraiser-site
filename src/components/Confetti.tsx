import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/device";

const COLOURS = ["#d7141a", "#14110f", "#ffffff", "#ffd9cf"];
const COUNT = 110;
const LIFE = 2800;

/** One burst of confetti, then it removes itself. Skipped for reduced motion. */
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || prefersReducedMotion()) return;

    const w = (canvas.width = innerWidth);
    const h = (canvas.height = innerHeight);
    const bits = Array.from({ length: COUNT }, (_, i) => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.4,
      y: h * 0.35,
      vx: (Math.random() - 0.5) * 900,
      vy: -300 - Math.random() * 700,
      size: 6 + Math.random() * 7,
      spin: Math.random() * 6,
      colour: COLOURS[i % COLOURS.length],
    }));

    const t0 = performance.now();
    let last = t0;
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const age = now - t0;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, age - LIFE * 0.6) / (LIFE * 0.4));
      for (const b of bits) {
        b.vy += 1500 * dt;
        b.vx *= 0.99;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.spin += 8 * dt;
        ctx.fillStyle = b.colour;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.spin);
        ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
        ctx.restore();
      }
      if (age < LIFE) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}
