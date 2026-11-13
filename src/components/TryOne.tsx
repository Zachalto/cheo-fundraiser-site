import { useCallback, useEffect, useRef, useState } from "react";
import { event } from "../config/event";
import { draw, GAME_SECONDS, H, newGame, rankFor, RANKS, step, tap, W, type Game } from "../game/engine";
import { countdown } from "../lib/format";
import {
  checkHomeroom,
  checkName,
  claimCode,
  fetchTop,
  HOMEROOM_MAX,
  leaderboardOn,
  loadHomeroom,
  loadName,
  NAME_MAX,
  postScore,
  saveHomeroom,
  saveName,
  type Row,
} from "../lib/leaderboard";
import { loadBest, saveBest } from "../lib/share";
import { Leaderboard, type BoardStatus } from "./Leaderboard";
import { SectionHead } from "./SectionHead";
import { ShareButton } from "./ShareButton";

type Phase = "idle" | "playing" | "done";
type PostState = "idle" | "sending" | "sent" | "error";

export function TryOne() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tapRef = useRef<HTMLButtonElement>(null);
  const replayRef = useRef<HTMLButtonElement>(null);
  const game = useRef<Game>(newGame());
  const deadline = useRef(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(loadBest);
  const [newBest, setNewBest] = useState(false);

  // Leaderboard
  const [rows, setRows] = useState<Row[]>([]);
  const [boardStatus, setBoardStatus] = useState<BoardStatus>("loading");
  const [name, setName] = useState(loadName);
  const [homeroom, setHomeroom] = useState(loadHomeroom);
  const [postedAs, setPostedAs] = useState(loadName);
  const [myCode, setMyCode] = useState("");
  const [post, setPost] = useState<PostState>("idle");
  const [postNote, setPostNote] = useState("");

  const refreshBoard = useCallback(async () => {
    if (!leaderboardOn) return;
    try {
      setRows(await fetchTop());
      setBoardStatus("ready");
    } catch {
      setBoardStatus("error");
    }
  }, []);

  useEffect(() => {
    void refreshBoard();
  }, [refreshBoard]);

  async function submitScore(e: React.FormEvent) {
    e.preventDefault();
    if (post === "sending" || post === "sent") return;
    const check = checkName(name);
    if (!check.ok) {
      setPost("error");
      setPostNote(check.reason);
      return;
    }
    const room = checkHomeroom(homeroom);
    if (room === null) {
      setPost("error");
      setPostNote("Homeroom: letters and numbers only, like 12A.");
      return;
    }
    setPost("sending");
    setPostNote("");
    try {
      await postScore(check.name, score, room);
      saveName(check.name);
      saveHomeroom(room);
      setMyCode(claimCode());
      setPostedAs(check.name);
      setPost("sent");
      setPostNote("Posted.");
      await refreshBoard();
    } catch {
      setPost("error");
      setPostNote("That didn't go through. Try again in a minute.");
    }
  }

  // Size the canvas for sharp lines without overdoing it on dense screens.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, game.current, false);
  }, []);

  // The game loop only runs while a round is being played.
  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const g = game.current;
      const end = Math.min(now, deadline.current);
      const dt = Math.min(0.05, Math.max(0, end - last) / 1000);
      const remaining = Math.max(0, deadline.current - now);
      last = end;
      const running = remaining > 0;
      step(g, dt);
      draw(ctx, g, running);
      setSeconds(Math.ceil(remaining / 1000));
      setScore(g.score);
      if (running) {
        raf = requestAnimationFrame(frame);
      } else {
        const previous = Math.max(best, loadBest());
        if (g.score > previous) {
          saveBest(g.score);
          setNewBest(true);
        }
        setBest(Math.max(g.score, previous));
        const moveFocus = document.activeElement === tapRef.current;
        setPhase("done");
        if (moveFocus) requestAnimationFrame(() => replayRef.current?.focus({ preventScroll: true }));
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [best, phase]);

  const start = useCallback(() => {
    game.current = newGame();
    deadline.current = performance.now() + GAME_SECONDS * 1000;
    setScore(0);
    setSeconds(GAME_SECONDS);
    setNewBest(false);
    setPost("idle");
    setPostNote("");
    setPhase("playing");
    requestAnimationFrame(() => tapRef.current?.focus({ preventScroll: true }));
  }, []);

  const drop = () => {
    if (phase === "playing" && performance.now() < deadline.current) tap(game.current);
  };
  const rank = rankFor(score);

  return (
    <section className="section tryone" id="try" aria-labelledby="try-title">
      <SectionHead
        id="try-title"
        title="Try one"
        sub="Tap to drop the cup onto the dashed outline. Miss and you lose the last cup you placed. You get 60 seconds."
      />

      <div className="tryone__layout">
      <div className="arena">
        <div className="arena__hud">
          <span>
            Time <strong>{countdown(seconds)}</strong>
          </span>
          <span>
            Score <strong>{score}</strong>
          </span>
          <span>
            Best <strong>{best}</strong>
          </span>
        </div>

        <div className="arena__stage">
          <button
            ref={tapRef}
            type="button"
            className="arena__tap"
            aria-label="Drop the cup"
            disabled={phase !== "playing"}
            onPointerDown={(e) => {
              if (e.isPrimary && e.button === 0) drop();
            }}
            onClick={(e) => {
              if (e.detail === 0) drop(); // keyboard (Space or Enter)
            }}
          >
            <canvas ref={canvasRef} className="arena__canvas" />
          </button>

          {phase === "idle" && (
            <div className="arena__overlay">
              <button type="button" className="btn" onClick={start}>
                Start
              </button>
              <p>Works with a tap, a click or the space bar.</p>
            </div>
          )}

          {phase === "done" && (
            <div className="arena__overlay arena__overlay--done">
              <p className="arena__score">{score}</p>
              <p className="arena__rank">{rank}</p>
              {newBest && <p className="arena__best">New best</p>}
              {leaderboardOn && score > 0 && (
                <form className="postscore" onSubmit={submitScore}>
                  <label htmlFor="post-name">Name for the leaderboard</label>
                  <div className="postscore__row">
                    <input
                      id="post-name"
                      type="text"
                      value={name}
                      maxLength={NAME_MAX}
                      autoComplete="off"
                      autoCapitalize="words"
                      enterKeyHint="send"
                      disabled={post === "sending" || post === "sent"}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <input
                      className="postscore__room"
                      type="text"
                      value={homeroom}
                      maxLength={HOMEROOM_MAX}
                      autoComplete="off"
                      placeholder="Homeroom"
                      aria-label="Homeroom (optional, only organisers see it)"
                      disabled={post === "sending" || post === "sent"}
                      onChange={(e) => setHomeroom(e.target.value)}
                    />
                    <button type="submit" className="btn btn--sm" disabled={post === "sending" || post === "sent"}>
                      {post === "sending" ? "Posting" : post === "sent" ? "Posted" : "Post"}
                    </button>
                  </div>
                  <p className="postscore__note" role="status">
                    {post === "idle" ? "Use a name people know you by. Homeroom is optional and only organisers see it." : postNote}
                  </p>
                </form>
              )}              <div className="arena__actions">
                <button ref={replayRef} type="button" className="btn" onClick={start}>
                  Play again
                </button>
                <ShareButton
                  label="Share score"
                  text={`I got ${score} on the ${event.name} cup stack (${rank}). Beat that.`}
                />
              </div>
            </div>
          )}
        </div>

        <p className="sr-only" role="status">
          {phase === "done" ? `Time. You scored ${score}. Rank: ${rank}.` : ""}
        </p>
      </div>

      <aside className="ranks" aria-labelledby="board-title">
        <Leaderboard rows={rows} status={boardStatus} myName={postedAs} myCode={myCode} />
        <details className="ranks__more">
        <summary>Rank titles and scoring</summary>
        <ol className="ranks__list">
          {[...RANKS].reverse().map(([min, name]) => {
            const earned = best > 0 && rankFor(best) === name;
            return (
              <li key={name} className={earned ? "ranks__row ranks__row--you" : "ranks__row"}>
                <span className="ranks__min">{min}+</span>
                <span className="ranks__name">{name}</span>
                {earned && <span className="ranks__you">you</span>}
              </li>
            );
          })}
        </ol>
        <p className="ranks__scoring">
          A cup is worth 10 to 30 points depending on how close to the centre it lands. Every hit in a row makes
          the next cup worth more. A miss knocks your last cup off and ends the streak. Finishing a pyramid is
          worth 50, and the next one is bigger, faster, and the cup starts changing direction on you.
        </p>
        </details>
      </aside>
      </div>
    </section>
  );
}
