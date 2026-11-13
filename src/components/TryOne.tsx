import { useCallback, useEffect, useRef, useState } from "react";
import { event } from "../config/event";
import { draw, GAME_SECONDS, H, newGame, rankFor, RANKS, step, tap, W, type Game } from "../game/engine";
import { loadBest, saveBest } from "../lib/share";
import { SectionHead } from "./SectionHead";
import { ShareButton } from "./ShareButton";

type Phase = "idle" | "playing" | "done";

export function TryOne() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tapRef = useRef<HTMLButtonElement>(null);
  const game = useRef<Game>(newGame());
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [newBest, setNewBest] = useState(false);

  useEffect(() => setBest(loadBest()), []);

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
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const running = step(g, dt);
      draw(ctx, g, running);
      setSeconds(Math.ceil(g.timeLeft));
      setScore(g.score);
      if (running) {
        raf = requestAnimationFrame(frame);
      } else {
        const previous = loadBest();
        if (g.score > previous) {
          saveBest(g.score);
          setBest(g.score);
          setNewBest(true);
        }
        setPhase("done");
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const start = useCallback(() => {
    game.current = newGame();
    setScore(0);
    setSeconds(GAME_SECONDS);
    setNewBest(false);
    setPhase("playing");
    requestAnimationFrame(() => tapRef.current?.focus({ preventScroll: true }));
  }, []);

  const drop = () => phase === "playing" && tap(game.current);
  const rank = rankFor(score);

  return (
    <section className="section tryone" id="try" aria-labelledby="try-title">
      <SectionHead
        id="try-title"
        title="Try one"
        sub="Tap to drop the cup onto the dashed outline. You get 60 seconds to stack as many as you can."
      />

      <div className="tryone__layout">
      <div className="arena">
        <div className="arena__hud">
          <span>
            Time <strong>0:{String(seconds).padStart(2, "0")}</strong>
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
            onPointerDown={drop}
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
              <div className="arena__actions">
                <button type="button" className="btn" onClick={start}>
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

      <aside className="ranks" aria-labelledby="ranks-title">
        <h3 id="ranks-title">Ranks</h3>
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
          10 points for every cup you land. 25 if it's dead centre. 50 more each time you finish a pyramid, and
          then the next one is bigger and faster.
        </p>
      </aside>
      </div>
    </section>
  );
}
