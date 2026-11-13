import { event } from "../config/event";
import { GameAnim } from "./GameAnim";
import { SectionHead } from "./SectionHead";

function Difficulty({ level, note }: { level: number; note: string }) {
  return (
    <p className="difficulty">
      <span className="difficulty__pips" role="img" aria-label={`Difficulty ${level} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`pip${n <= level ? " pip--on" : ""}`} />
        ))}
      </span>
      <span className="difficulty__note">{note}</span>
    </p>
  );
}

export function Games() {
  const count = event.games.length;
  return (
    <section className="section section--ink games" id="games" aria-labelledby="games-title">
      <SectionHead
        id="games-title"
        title="The games"
        sub={`${count} games. You get one minute for each.`}
      />
      <ol className="game-list">
        {event.games.map((g, i) => (
          <li key={g.name} className="game-card">
            <div className="game-card__anim">
              <GameAnim kind={g.animation} />
              <span className="game-card__num" aria-hidden="true">
                {i + 1}
              </span>
            </div>
            <div className="game-card__body">
              <h3>{g.name}</h3>
              <p className="game-card__rule">{g.rule}</p>
              <Difficulty level={g.difficulty} note={g.difficultyNote} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
