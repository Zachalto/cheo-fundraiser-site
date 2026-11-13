import { event } from "../config/event";

/** The sincere section. No jokes, no motion. Text comes only from the config file. */
export function WhyCheo() {
  const hasText = event.cheoText.length > 0;
  return (
    <section className="section cheo" id="why" aria-labelledby="why-title">
      <div className="cheo__inner">
        <h2 id="why-title">Why {event.charity}</h2>
        {hasText ? (
          event.cheoText.map((p) => <p key={p}>{p}</p>)
        ) : (
          <p className="placeholder-note">
            [Placeholder] Text about {event.charity} goes here. Add it to <code>cheoText</code> in the config file.
          </p>
        )}
        {event.cheoTodo && <p className="placeholder-note">[Placeholder] {event.cheoTodo}</p>}
        <p>
          <a className="text-link" href={event.cheoUrl} target="_blank" rel="noopener noreferrer">
            Learn about {event.charity} on their own site
            <span className="sr-only"> (opens in a new tab)</span>
            <span aria-hidden="true"> →</span>
          </a>
        </p>
      </div>
    </section>
  );
}
