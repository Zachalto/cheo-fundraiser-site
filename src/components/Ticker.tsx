import { Fragment } from "react";
import { event } from "../config/event";
import { isSet } from "../lib/format";

/** Decorative scrolling strip. Hidden from screen readers; the same info is in the page. */
export function Ticker() {
  const lines = [
    "Minute to Win It",
    `For ${event.charity}`,
    isSet(event.date) ? event.date : "At lunch",
    isSet(event.location) ? event.location : `Run by ${event.classCode}`,
  ];
  const run = (
    <span className="ticker__run">
      {lines.map((line) => (
        <span key={line} className="ticker__item">
          {line}
        </span>
      ))}
    </span>
  );
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        {/* Eight copies, so the strip is never empty, even on a very wide monitor. */}
        {Array.from({ length: 8 }, (_, i) => (
          <Fragment key={i}>{run}</Fragment>
        ))}
      </div>
    </div>
  );
}
