import { event, type Sponsor } from "../config/event";
import { isSet } from "../lib/format";
import { SectionHead } from "./SectionHead";

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const inner = sponsor.logoSrc ? (
    <img src={sponsor.logoSrc} alt={sponsor.name} loading="lazy" />
  ) : (
    <span className="sponsor__name">{sponsor.name}</span>
  );
  if (!sponsor.url) return <li className="sponsor">{inner}</li>;
  return (
    <li className="sponsor">
      <a href={sponsor.url} target="_blank" rel="noopener noreferrer">
        {inner}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </li>
  );
}

/** Sponsors from the config file. Shows an invitation while the list is empty. */
export function Sponsors() {
  const has = event.sponsors.length > 0;
  return (
    <section className="section sponsors" id="sponsors" aria-labelledby="sponsors-title">
      <SectionHead
        id="sponsors-title"
        title="Sponsors"
        sub={has ? "Thank you to the people and businesses helping us run this." : undefined}
      />
      {has ? (
        <ul className="sponsor-list">
          {event.sponsors.map((s) => (
            <SponsorCard key={s.name} sponsor={s} />
          ))}
        </ul>
      ) : (
        <div className="sponsor-empty">
          <p>We're looking for sponsors. If you or your business can donate a prize, supplies or money, we'd love to hear from you.</p>
          <p>
            <strong>Contact:</strong>{" "}
            {isSet(event.teacherContact) ? event.teacherContact : "[placeholder: teacher contact to be added]"}
          </p>
        </div>
      )}
    </section>
  );
}
