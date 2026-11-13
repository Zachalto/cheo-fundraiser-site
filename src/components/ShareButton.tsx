import { useState } from "react";
import { share } from "../lib/share";

interface Props {
  text: string;
  label?: string;
  className?: string;
}

export function ShareButton({ text, label = "Send to a friend", className = "btn btn--ghost" }: Props) {
  const [note, setNote] = useState("");

  async function onClick() {
    const result = await share(text);
    setNote(result === "copied" ? "Link copied" : result === "failed" ? "Couldn't share. Copy the address instead." : "");
    if (result === "copied") window.setTimeout(() => setNote(""), 2500);
  }

  return (
    <span className="share">
      <button type="button" className={className} onClick={onClick}>
        {label}
      </button>
      <span className="share__note" role="status">
        {note}
      </span>
    </span>
  );
}
