import { event } from "../config/event";
import { isSet } from "../lib/format";
import { leaderboardOn, type Row } from "../lib/leaderboard";

export type BoardStatus = "loading" | "ready" | "error";

interface Props {
  rows: Row[];
  status: BoardStatus;
  /** The name this visitor posted under, so their row can be marked. */
  myName: string;
}

export function Leaderboard({ rows, status, myName }: Props) {
  const { finalists, prize, closes } = event.leaderboard;
  const mine = myName.trim().toLowerCase();

  return (
    <div className="board">
      <h3 id="board-title">Leaderboard</h3>
      <p className="board__rule">
        The top {finalists} when the leaderboard closes{isSet(closes) ? ` (${closes})` : ""} play this game live at
        the event. Best live score wins {isSet(prize) ? prize : "a prize. We'll say what it is soon"}.
      </p>

      {!leaderboardOn ? (
        <p className="board__empty">The leaderboard isn't open yet. Your best score is saved on this phone for now.</p>
      ) : status === "loading" ? (
        <p className="board__empty">Loading scores…</p>
      ) : status === "error" ? (
        <p className="board__empty">Couldn't load the leaderboard. Check your connection and refresh.</p>
      ) : rows.length === 0 ? (
        <p className="board__empty">Nobody's on it yet. First score takes first place.</p>
      ) : (
        <ol className="board__list">
          {rows.map((row, i) => {
            const you = mine !== "" && row.name.trim().toLowerCase() === mine;
            const cls = `board__row${i < finalists ? " board__row--final" : ""}${you ? " board__row--you" : ""}`;
            return (
              <li key={row.name} className={cls}>
                <span className="board__place">{i + 1}</span>
                <span className="board__name">{row.name}</span>
                {you && <span className="ranks__you">you</span>}
                <span className="board__score">{row.score}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
