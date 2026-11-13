/*
 * Cup stacking mini-game. Plain canvas, no libraries.
 * A cup slides back and forth along the top. Tap to drop it. Land it on the
 * dashed outline to place it. Finish a pyramid and a bigger one appears.
 */

export const W = 320;
export const H = 400;
export const GAME_SECONDS = 60;

const CUP_W = 46;
const CUP_H = 52;
const SLIDER_Y = 34;
const FLOOR_Y = H - 22;
// How close to the outline a drop has to be. Smaller numbers = harder.
const HIT = CUP_W * 0.3;
const PERFECT = CUP_W * 0.07;
// How fast the cup slides: at the start, the top speed, and how much it speeds up.
const START_SPEED = 3.0;
const MAX_SPEED = 4.8;
const SPEED_PER_CUP = 0.05;
const SPEED_PER_PYRAMID = 0.3;
// Points: 10 for barely landing it, up to 30 for dead centre.
const MIN_POINTS = 10;
const MAX_POINTS = 30;
// Every hit in a row adds 15% to the next cup, up to 10 in a row. A miss resets it.
const STREAK_BONUS = 0.15;
const STREAK_CAP = 10;
const PYRAMID_BONUS = 50;
// From the second pyramid on, the sliding cup sometimes changes direction without warning.
const FAKE_OUT_MIN = 0.7;
const FAKE_OUT_MAX = 1.9;
const MAX_BASE = 5;

const RED = "#d7141a";
const INK = "#14110f";

interface Slot {
  x: number;
  y: number;
  filled: boolean;
}
interface Drop {
  x: number;
  y: number;
  slot: number; // index it's falling to, or -1 for a miss
  perfect: boolean;
  points: number;
  spin: number;
}
interface Flash {
  text: string;
  x: number;
  y: number;
  life: number;
}

export interface Game {
  score: number;
  placed: number;
  base: number;
  slots: Slot[];
  next: number;
  phase: number;
  speed: number;
  dir: 1 | -1;
  fakeOutIn: number;
  streak: number;
  drop: Drop | null;
  pause: number;
  flashes: Flash[];
}

function buildSlots(base: number): Slot[] {
  const slots: Slot[] = [];
  for (let row = 0; row < base; row++) {
    const count = base - row;
    for (let i = 0; i < count; i++) {
      slots.push({
        x: W / 2 + (i - (count - 1) / 2) * (CUP_W + 2),
        y: FLOOR_Y - row * (CUP_H - 3),
        filled: false,
      });
    }
  }
  return slots;
}

export function newGame(): Game {
  return {
    score: 0,
    placed: 0,
    base: 3,
    slots: buildSlots(3),
    next: 0,
    phase: Math.PI / 2,
    speed: START_SPEED,
    dir: 1,
    fakeOutIn: FAKE_OUT_MAX,
    streak: 0,
    drop: null,
    pause: 0,
    flashes: [],
  };
}

const sliderX = (g: Game) => W / 2 + ((W - CUP_W) / 2 - 8) * Math.sin(g.phase);

/** The player tapped. */
export function tap(g: Game) {
  if (g.drop || g.pause > 0) return;
  const x = sliderX(g);
  const target = g.slots[g.next];
  const off = Math.abs(x - target.x);
  const hit = off <= HIT;
  const accuracy = hit ? 1 - off / HIT : 0;
  const base = MIN_POINTS + (MAX_POINTS - MIN_POINTS) * accuracy * accuracy;
  const points = Math.round(base * (1 + STREAK_BONUS * Math.min(g.streak, STREAK_CAP)));
  g.drop = { x, y: SLIDER_Y + CUP_H, slot: hit ? g.next : -1, perfect: off <= PERFECT, points, spin: 0 };
}

/** Advance the game physics by dt seconds. */
export function step(g: Game, dt: number) {
  g.phase += g.dir * g.speed * dt;
  if (g.base > 3 && !g.drop) {
    g.fakeOutIn -= dt;
    if (g.fakeOutIn <= 0) {
      g.dir = g.dir === 1 ? -1 : 1;
      g.fakeOutIn = FAKE_OUT_MIN + Math.random() * (FAKE_OUT_MAX - FAKE_OUT_MIN);
    }
  }
  g.flashes = g.flashes.filter((f) => (f.life -= dt) > 0);

  if (g.pause > 0) {
    g.pause -= dt;
    if (g.pause <= 0) {
      g.base = Math.min(MAX_BASE, g.base + 1);
      g.slots = buildSlots(g.base);
      g.next = 0;
    }
  }

  const d = g.drop;
  if (d) {
    d.y += 1500 * dt;
    if (d.slot >= 0) {
      const slot = g.slots[d.slot];
      d.x += (slot.x - d.x) * Math.min(1, dt * 18);
      if (d.y >= slot.y) {
        slot.filled = true;
        g.placed += 1;
        g.next += 1;
        g.score += d.points;
        g.streak += 1;
        g.speed = Math.min(MAX_SPEED, g.speed + SPEED_PER_CUP);
        g.phase = Math.random() * Math.PI * 2; // the next cup starts somewhere new, so there's no rhythm to learn
        g.flashes.push({
          text: (d.perfect ? "Perfect +" : "+") + d.points,
          x: Math.min(W - 60, Math.max(60, slot.x)),
          y: slot.y - CUP_H - 8,
          life: 0.7,
        });
        g.drop = null;
        if (g.next >= g.slots.length) {
          g.score += PYRAMID_BONUS;
          g.speed = Math.min(MAX_SPEED, g.speed + SPEED_PER_PYRAMID);
          g.pause = 0.45;
          g.flashes.push({ text: "Pyramid! +50", x: W / 2, y: H / 2 - 30, life: 1 });
        }
      }
    } else {
      d.spin += dt * 9;
      if (d.y > H + CUP_H) {
        // A miss knocks your last cup off the pyramid and ends your streak. Points already earned stay.
        g.streak = 0;
        if (g.next > 0) {
          g.next -= 1;
          g.placed -= 1;
          const lost = g.slots[g.next];
          lost.filled = false;
          g.flashes.push({ text: "Miss. Cup lost", x: lost.x, y: lost.y - CUP_H - 8, life: 0.8 });
        } else {
          g.flashes.push({ text: "Miss", x: d.x, y: FLOOR_Y - 30, life: 0.6 });
        }
        g.phase = Math.random() * Math.PI * 2;
        g.drop = null;
      }
    }
  }
}

function cupPath(ctx: CanvasRenderingContext2D) {
  // Drawn with its bottom-centre at 0,0. Upside down, like a stacking cup.
  ctx.beginPath();
  ctx.moveTo(-CUP_W * 0.27, -CUP_H);
  ctx.lineTo(CUP_W * 0.27, -CUP_H);
  ctx.lineTo(CUP_W * 0.44, -6);
  ctx.lineTo(-CUP_W * 0.44, -6);
  ctx.closePath();
}

function drawCup(ctx: CanvasRenderingContext2D, x: number, y: number, ghost = false, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (spin) {
    ctx.translate(0, -CUP_H / 2);
    ctx.rotate(spin);
    ctx.translate(0, CUP_H / 2);
  }
  ctx.lineJoin = "round";
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = INK;
  cupPath(ctx);
  if (ghost) {
    ctx.setLineDash([6, 5]);
    ctx.globalAlpha = 0.55;
    ctx.stroke();
  } else {
    ctx.fillStyle = RED;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.roundRect(-CUP_W / 2, -8, CUP_W, 8, 4);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function draw(ctx: CanvasRenderingContext2D, g: Game, playing: boolean) {
  ctx.clearRect(0, 0, W, H);

  // table
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(10, FLOOR_Y, W - 20, 8, 4);
  ctx.fill();

  g.slots.forEach((s, i) => {
    if (s.filled) drawCup(ctx, s.x, s.y);
    else if (playing && i === g.next && g.pause <= 0) drawCup(ctx, s.x, s.y, true);
  });

  if (playing && !g.drop && g.pause <= 0) {
    // rail and the sliding cup
    ctx.fillStyle = "rgba(20,17,15,.15)";
    ctx.fillRect(14, SLIDER_Y + CUP_H + 3, W - 28, 3);
    drawCup(ctx, sliderX(g), SLIDER_Y + CUP_H);
  }
  if (g.drop) drawCup(ctx, g.drop.x, g.drop.y, false, g.drop.spin);

  ctx.font = '400 20px "Anton", Impact, sans-serif';
  ctx.textAlign = "center";
  for (const f of g.flashes) {
    ctx.globalAlpha = Math.min(1, f.life * 3);
    ctx.fillStyle = INK;
    ctx.fillText(f.text.toUpperCase(), f.x, f.y - (0.7 - f.life) * 24);
  }
  ctx.globalAlpha = 1;
}

/** Rank titles, lowest score first. */
export const RANKS: [number, string][] = [
  [0, "Benchwarmer"],
  [40, "Cafeteria Rookie"],
  [100, "Decent, Actually"],
  [200, "Lunch Table Legend"],
  [350, "Probably Practised In Class"],
];

export function rankFor(score: number): string {
  let title = RANKS[0][1];
  for (const [min, name] of RANKS) if (score >= min) title = name;
  return title;
}
