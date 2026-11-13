import { event } from "../config/event";
import { isSet } from "../lib/format";
import { Wordmark } from "./Wordmark";

function Social({ name, url }: { name: string; url: string | null }) {
  if (!isSet(url)) {
    return <span className="footer__social footer__social--pending">{name}: coming soon</span>;
  }
  return (
    <a className="footer__social" href={url} target="_blank" rel="noopener noreferrer">
      {name}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <Wordmark className="footer__mark" />
      <nav className="footer__socials" aria-label="Social media">
        <Social name="Instagram" url={event.instagramUrl} />
        <Social name="TikTok" url={event.tiktokUrl} />
      </nav>
      <p>
        Run by the {event.classCode} class, in support of {event.charity}.
      </p>
      <p className="footer__small">
        Teacher contact:{" "}
        {isSet(event.teacherContact) ? event.teacherContact : "[placeholder: to be added]"}
      </p>
      <p className="footer__small">
        A student-run fundraiser. Not an official {event.charity} website. This site takes no payments and
        collects no personal information.
      </p>
    </footer>
  );
}
