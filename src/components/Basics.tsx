import { event } from "../config/event";
import { isSet } from "../lib/format";
import { SectionHead } from "./SectionHead";

interface Stat {
  label: string;
  value: string | null;
  /** Shown when the value isn't decided yet. */
  pending: string;
  wide?: boolean;
}

const STATS: Stat[] = [
  { label: "When", value: event.date, pending: "Date dropping soon" },
  { label: "Time", value: event.time, pending: "At lunch" },
  { label: "Where", value: event.location, pending: "Room coming soon" },
  { label: "Cost to play", value: event.price, pending: "Price coming soon" },
  { label: "Who can play", value: event.whoCanPlay, pending: "Details coming soon", wide: true },
];

export function Basics() {
  return (
    <section className="section basics" id="basics" aria-labelledby="basics-title">
      <SectionHead id="basics-title" title="The basics" />
      <dl className="stats">
        {STATS.map((s) => {
          const ready = isSet(s.value);
          return (
            <div
              key={s.label}
              className={`stat${s.wide ? " stat--wide" : ""}${ready ? "" : " stat--pending"}`}
            >
              <dt>{s.label}</dt>
              <dd>{ready ? s.value : s.pending}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
