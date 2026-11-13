import type { GameAnimation } from "../config/event";
import { Cup } from "./Cup";

/** Tiny looping CSS/SVG animations for the game cards. Decorative: the rule text says the same thing. */
export function GameAnim({ kind }: { kind: GameAnimation }) {
  return (
    <svg className={`anim anim--${kind}`} viewBox="0 0 200 120" aria-hidden="true" focusable="false">
      <rect x="10" y="108" width="180" height="6" rx="3" fill="var(--ink)" />
      {kind === "cups" && (
        <g transform="translate(46 -2) scale(.6)">
          <Cup x={30} y={110} />
          <Cup x={90} y={110} />
          <Cup x={60} y={48} className="anim-drop" />
        </g>
      )}
      {kind === "cookie" && (
        <>
          <circle cx="100" cy="58" r="44" fill="var(--cream)" stroke="var(--ink)" strokeWidth="3" />
          <circle cx="84" cy="50" r="4" fill="var(--ink)" />
          <circle cx="116" cy="50" r="4" fill="var(--ink)" />
          <ellipse cx="100" cy="82" rx="11" ry="7" fill="var(--ink)" />
          <g className="anim-cookie">
            <circle cx="100" cy="26" r="10" fill="#c98a3c" stroke="var(--ink)" strokeWidth="2.5" />
            <circle cx="97" cy="24" r="1.6" fill="var(--ink)" />
            <circle cx="103" cy="29" r="1.6" fill="var(--ink)" />
          </g>
        </>
      )}
      {kind === "pingpong" && (
        <>
          <g transform="translate(134 62) scale(.66) rotate(180 30 35)">
            <Cup />
          </g>
          <g className="anim-ball-x">
            <circle className="anim-ball-y" cx="24" cy="98" r="8" fill="#fff" stroke="var(--ink)" strokeWidth="2.5" />
          </g>
        </>
      )}
      {kind === "balloons" && (
        <>
          {[
            { x: 52, c: "var(--red)", d: "0s" },
            { x: 100, c: "#fff", d: "-.9s" },
            { x: 148, c: "var(--red)", d: "-1.7s" },
          ].map((b) => (
            <g key={b.x} className="anim-balloon" style={{ animationDelay: b.d }}>
              <ellipse cx={b.x} cy="46" rx="18" ry="22" fill={b.c} stroke="var(--ink)" strokeWidth="2.5" />
              <path d={`M${b.x} 68l-4 7h8z`} fill={b.c} stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
