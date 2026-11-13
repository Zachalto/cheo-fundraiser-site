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
const HIT = CUP_W * 0.5;
const PERFECT = CUP_W * 0.12;
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
  spin: number;
}
interface Flash {
  text: string;
  x: number;
  y: number;
  life: number;
}

export interface Game {
  timeLeft: number;
  score: number;
  placed: number;
  base: number;
  slots: Slot[];
  next: number;
  phase: number;
  speed: number;
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
    timeLeft: GAME_SECONDS,
    score: 0,
    placed: 0,
    base: 3,
    slots: buildSlots(3),
    next: 0,
    phase: Math.PI / 2,
    speed: 2.0,
    drop: null,
    pause: 0,
    flashes: [],
  };
}

const sliderX = (g: Game) => W / 2 + ((W - CUP_W) / 2 - 8) * Math.sin(g.phase);

/** The player tapped. */
export function tap(g: Game) {
  if (g.drop || g.pause > 0 || g.timeLeft <= 0) return;
  const x = sliderX(g);
  const target = g.slots[g.next];
  const off = Math.abs(x - target.x);
  g.drop = { x, y: SLIDER_Y + CUP_H, slot: off <= HIT ? g.next : -1, perfect: off <= PERFECT, spin: 0 };
}

/** Advance the game by dt seconds. Returns false once time is up. */
export function step(g: Game, dt: number): boolean {
  g.timeLeft = Math.max(0, g.timeLeft - dt);
  g.phase += g.speed * dt;
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
        g.score += d.perfect ? 25 : 10;
        g.speed = Math.min(4, g.speed + 0.03);
        g.flashes.push({ text: d.perfect ? "Perfect +25" : "+10", x: slot.x, y: slot.y - CUP_H - 8, life: 0.7 });
        g.drop = null;
        if (g.next >= g.slots.length) {
          g.score += 50;
          g.speed = Math.min(4, g.speed + 0.2);
          g.pause = 0.45;
          g.flashes.push({ text: "Pyramid! +50", x: W / 2, y: H / 2 - 30, life: 1 });
        }
      }
    } else {
      d.spin += dt * 9;
      if (d.y > H + CUP_H) {
        g.flashes.push({ text: "Miss", x: d.x, y: FLOOR_Y - 30, life: 0.6 });
        g.drop = null;
      }
    }
  }
  return g.timeLeft > 0;
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
  [100, "Cafeteria Rookie"],
  [250, "Decent, Actually"],
  [400, "Lunch Table Legend"],
  [550, "Probably Practised In Class"],
];

export function rankFor(score: number): string {
  let title = RANKS[0][1];
  for (const [min, name] of RANKS) if (score >= min) title = name;
  return title;
}
