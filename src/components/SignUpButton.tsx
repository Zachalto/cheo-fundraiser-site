import { event } from "../config/event";
import { isSet } from "../lib/format";

interface Props {
  size?: "sm" | "lg";
  variant?: "red" | "ink";
}

/** Outbound link to the sign-up form. Shows a clear "soon" state until the URL exists. */
export function SignUpButton({ size = "lg", variant = "red" }: Props) {
  const cls = `btn btn--${size} btn--${variant}`;
  if (!isSet(event.signUpUrl)) {
    return (
      <span className={`${cls} btn--pending`} role="note">
        {size === "sm" ? "Sign-ups soon" : "Sign-ups open soon"}
      </span>
    );
  }
  return (
    <a className={cls} href={event.signUpUrl} target="_blank" rel="noopener noreferrer">
      Sign up
      <span className="sr-only"> (opens the sign-up form in a new tab)</span>
      <span aria-hidden="true"> →</span>
    </a>
  );
}
