import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { event } from "../config/event";
import { canRun3D, isLowPower } from "../lib/device";
import { BigClock } from "./BigClock";
import { ShareButton } from "./ShareButton";
import { SignUpButton } from "./SignUpButton";
import { StaticHero } from "./StaticHero";

const CupScene = lazy(() => import("../three/CupScene"));

/** If the 3D scene crashes for any reason, quietly show the illustration instead. */
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function HeroScene() {
  const [use3D, setUse3D] = useState(false);

  useEffect(() => {
    if (isLowPower()) document.documentElement.dataset.lite = "true";
    if (!canRun3D()) return;

    // Only after the page has loaded and the browser has a spare moment.
    let idle = 0;
    let timeout = 0;
    const go = () => {
      // Safari has no requestIdleCallback, so fall back to a short delay.
      if (typeof window.requestIdleCallback === "function") {
        idle = requestIdleCallback(() => setUse3D(true), { timeout: 2500 });
      } else {
        timeout = setTimeout(() => setUse3D(true), 600) as unknown as number;
      }
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      if (idle) cancelIdleCallback(idle);
      window.clearTimeout(timeout);
    };
  }, []);

  const fallback = <StaticHero />;
  return (
    <div className="hero__scene">
      {use3D ? (
        <SceneBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <CupScene onGiveUp={() => setUse3D(false)} />
          </Suspense>
        </SceneBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__copy">
        <p className="hero__label">A fundraiser for {event.charity}</p>
        <h1 id="hero-title" className="hero__title">
          {event.name}
        </h1>
        <p className="hero__tagline">{event.tagline}</p>

        <div className="hero__actions">
          <SignUpButton />
          <ShareButton className="text-link text-link--btn" text={`${event.name}: ${event.tagline} It's for ${event.charity}.`} />
        </div>
      </div>

      <BigClock />
      <HeroScene />
    </section>
  );
}
