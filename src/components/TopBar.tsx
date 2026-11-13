import { useEffect, useState } from "react";
import { event } from "../config/event";
import { useSecondsLeft } from "../lib/clock";
import { Wordmark } from "./Wordmark";
import { SignUpButton } from "./SignUpButton";

export function TopBar() {
  const left = useSecondsLeft();
  const [heroClockVisible, setHeroClockVisible] = useState(true);

  // The small clock takes over once the big one has scrolled away.
  useEffect(() => {
    const big = document.getElementById("bigclock");
    if (!big || typeof IntersectionObserver === "undefined") {
      setHeroClockVisible(false);
      return;
    }
    const io = new IntersectionObserver(([e]) => setHeroClockVisible(e.isIntersecting), {
      rootMargin: "-58px 0px 0px 0px",
    });
    io.observe(big);
    return () => io.disconnect();
  }, []);

  return (
    <header className="topbar">
      <a className="topbar__home" href="#top" aria-label={`${event.name}, back to top`}>
        <Wordmark />
      </a>
      <div
        className={`topbar__clock${heroClockVisible ? " topbar__clock--hidden" : ""}${left === 0 ? " topbar__clock--done" : ""}`}
        aria-hidden="true"
      >
        0:{String(left).padStart(2, "0")}
      </div>
      <SignUpButton size="sm" />
    </header>
  );
}
