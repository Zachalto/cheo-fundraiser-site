import { useEffect, useState, type CSSProperties } from "react";
import { event } from "../config/event";
import { prefersReducedMotion } from "../lib/device";
import { money, progress } from "../lib/format";
import { useInView } from "../lib/useInView";
import { SectionHead } from "./SectionHead";

const FILL_MS = 1400;

/** Counts up from 0 to `target` once `run` is true. */
function useCountUp(target: number, run: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (target <= 0 || prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const t0 = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - t0) / FILL_MS);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return value;
}

export function Thermometer() {
  const [ref, seen] = useInView<HTMLDivElement>(true, 0.4);
  const pct = progress(event.raisedSoFar, event.goal);
  const shown = useCountUp(event.raisedSoFar, seen);

  return (
    <section className="section thermo" id="raised" aria-labelledby="raised-title">
      <SectionHead id="raised-title" title="Raised so far" />
      <div className="thermo__wrap" ref={ref}>
        <div
          className="thermo__tube"
          role="img"
          aria-label={`${money(event.raisedSoFar)} raised of a ${money(event.goal)} goal`}
          style={{ "--fill": seen ? pct : 0 } as CSSProperties}
        >
          <div className="thermo__fill" />
          <div className="thermo__ticks" />
        </div>
        <div className="thermo__bulb" aria-hidden="true" />
        <div className="thermo__numbers">
          <p className="thermo__raised" aria-hidden="true">
            {money(shown)}
          </p>
          <p className="thermo__goal">of our {money(event.goal)} goal</p>
          <p className="thermo__quip">
            {pct >= 1
              ? `We hit the goal. Thank you. Everything past this still goes to ${event.charity}.`
              : event.raisedSoFar <= 0
                ? "Nothing yet. We update this as the money comes in."
                : `${Math.round(pct * 100)}% of the way there.`}
          </p>
        </div>
      </div>
    </section>
  );
}
