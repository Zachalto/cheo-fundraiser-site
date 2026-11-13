import { event } from "../config/event";
import { ShareButton } from "./ShareButton";
import { SignUpButton } from "./SignUpButton";

export function SignUpFaq() {
  return (
    <section className="section section--red signup" id="signup" aria-labelledby="signup-title">
      <div className="signup__cta">
        <h2 id="signup-title">Sign up</h2>
        <p className="signup__line">It's one short form. Bring a friend so you have someone to beat.</p>
        <div className="signup__actions">
          <SignUpButton variant="ink" />
          <ShareButton
            text={`${event.name}: ${event.tagline} It's for ${event.charity}.`}
            className="btn btn--ghost btn--on-red"
          />
        </div>
      </div>

      <div className="faq">
        <h3>Questions</h3>
        {event.faq.map((f) => (
          <details key={f.question} className="faq__item">
            <summary>{f.question}</summary>
            <p>{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
