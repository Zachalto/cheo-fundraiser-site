import { CLOCK_SECONDS, restartClock, useSecondsLeft } from "../lib/clock";
import { Confetti } from "./Confetti";

/** The 60 second clock in the hero. It never locks or hides anything. */
export function BigClock() {
  const left = useSecondsLeft();
  const done = left === 0;
  const hurry = !done && left <= 10;

  return (
    <div id="bigclock" className={`bigclock${done ? " bigclock--done" : ""}${hurry ? " bigclock--hurry" : ""}`}>
      <div className="bigclock__face" aria-hidden="true">
        <span className="bigclock__num">{left}</span>
        <span className="bigclock__unit">sec</span>
      </div>
      <div className="bigclock__text">
        {done ? (
          <>
            <p className="bigclock__line">Time. You didn't finish. Neither will most contestants.</p>
            <button type="button" className="btn btn--sm btn--cream" onClick={restartClock}>
              Restart the clock
            </button>
          </>
        ) : (
          <p className="bigclock__line">
            You have {CLOCK_SECONDS} seconds to read this website. <strong>Go.</strong>
          </p>
        )}
      </div>
      <p className="sr-only" role="status">
        {done ? "The 60 second clock ran out. It's a joke: nothing is locked, keep reading." : ""}
      </p>
      {done && <Confetti />}
    </div>
  );
}
