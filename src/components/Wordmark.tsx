import { event } from "../config/event";

/** Text wordmark. Set `logoSrc` in the config to swap it for an image. */
export function Wordmark({ className = "" }: { className?: string }) {
  if (event.logoSrc) {
    return <img className={`wordmark-img ${className}`} src={event.logoSrc} alt={event.name} />;
  }
  return <span className={`wordmark ${className}`}>{event.name}</span>;
}
