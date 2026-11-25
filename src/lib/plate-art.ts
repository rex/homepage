/**
 * Deterministic, theme-safe generative "plate" art for project cards.
 *
 * No Math.random(): an FNV-1a hash of the project id seeds a mulberry32 PRNG,
 * so the same id renders the same art on every build (build-stable, no churn in
 * git). Every color comes from the design tokens via CSS classes (p-s / p-d /
 * p-a …), so the art flips with the light/dark theme automatically — it can
 * never re-introduce a hardcoded-hex bug. Each plate emits exactly one amber
 * element and nothing else in the accent color.
 *
 * The YAML `art:` value selects a shape grammar; `minimal` gets a small sigil.
 */
import type { PortfolioProject } from './portfolio-content';

type RNG = () => number;

function seedFrom(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 120;
const H = 72;
const PAD = 12;
const TAU = Math.PI * 2;

const nn = (v: number): number => Math.round(v * 100) / 100;
const rin = (rng: RNG, lo: number, hi: number): number => lo + rng() * (hi - lo);
const rint = (rng: RNG, lo: number, hi: number): number => Math.floor(rin(rng, lo, hi + 1));

const line = (x1: number, y1: number, x2: number, y2: number, c = 'p-s'): string =>
  `<line x1="${nn(x1)}" y1="${nn(y1)}" x2="${nn(x2)}" y2="${nn(y2)}" class="${c}"/>`;
const circ = (cx: number, cy: number, r: number, c = 'p-s'): string =>
  `<circle cx="${nn(cx)}" cy="${nn(cy)}" r="${nn(r)}" class="${c}"/>`;
const rect = (x: number, y: number, w: number, h: number, c = 'p-s', rx = 0): string =>
  `<rect x="${nn(x)}" y="${nn(y)}" width="${nn(w)}" height="${nn(h)}" rx="${rx}" class="${c}"/>`;
const poly = (pts: Array<[number, number]>, c = 'p-s'): string =>
  `<polyline points="${pts.map((p) => `${nn(p[0])},${nn(p[1])}`).join(' ')}" class="${c}"/>`;
const path = (d: string, c = 'p-s'): string => `<path d="${d}" class="${c}"/>`;

type Gen = (rng: RNG, dense: boolean) => string;

const gTerminal: Gen = (rng, dense) => {
  const out: string[] = [];
  const baseY = H - PAD;
  out.push(line(PAD, baseY, W - PAD, baseY, 'p-s'));
  const steps = dense ? 9 : 6;
  const pts: Array<[number, number]> = [];
  let prevY = PAD + 4 + rng() * (H - 2 * PAD - 8);
  for (let i = 0; i <= steps; i += 1) {
    const x = PAD + (i / steps) * (W - 2 * PAD);
    const y = PAD + 4 + rng() * (H - 2 * PAD - 8);
    if (i > 0) pts.push([x, prevY]);
    pts.push([x, y]);
    prevY = y;
  }
  out.push(poly(pts, 'p-d'));
  const mx = PAD + (0.35 + rng() * 0.4) * (W - 2 * PAD);
  out.push(line(mx, PAD, mx, baseY, 'p-a'));
  out.push(circ(mx, PAD + 2, 1.8, 'p-af'));
  return out.join('');
};

const gConsole: Gen = (rng, dense) => {
  const out: string[] = [];
  const count = dense ? 7 : 5;
  const nodes: Array<[number, number]> = [];
  for (let i = 0; i < count; i += 1) nodes.push([rin(rng, PAD, W - PAD), rin(rng, PAD, H - PAD)]);
  for (let i = 0; i < count; i += 1) {
    let best = -1;
    let bd = 1e9;
    for (let j = 0; j < count; j += 1) {
      if (i === j) continue;
      const dx = nodes[i][0] - nodes[j][0];
      const dy = nodes[i][1] - nodes[j][1];
      const dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = j; }
    }
    if (best >= 0) out.push(line(nodes[i][0], nodes[i][1], nodes[best][0], nodes[best][1], 'p-s'));
  }
  for (const nd of nodes) out.push(circ(nd[0], nd[1], 1.6, 'p-df'));
  const amber = nodes[rint(rng, 0, count - 1)];
  out.push(circ(amber[0], amber[1], 4.5, 'p-a'));
  out.push(circ(amber[0], amber[1], 2, 'p-af'));
  return out.join('');
};

const gTable: Gen = (rng, dense) => {
  const out: string[] = [];
  const rows = dense ? 5 : 4;
  const amberRow = rint(rng, 0, rows - 1);
  for (let i = 0; i < rows; i += 1) {
    const y = PAD + (i * (H - 2 * PAD)) / (rows - 1);
    const w = (0.35 + rng() * 0.5) * (W - 2 * PAD - 10);
    out.push(rect(PAD, y - 1.4, 2.8, 2.8, i === amberRow ? 'p-af' : 'p-sf'));
    out.push(line(PAD + 6, y, PAD + 6 + w, y, i === amberRow ? 'p-a' : 'p-s'));
  }
  return out.join('');
};

const gPhone: Gen = (rng, dense) => {
  const out: string[] = [];
  const w = 30;
  const h = H - 2 * PAD;
  const x = (W - w) / 2;
  const y = PAD;
  out.push(rect(x, y, w, h, 'p-s', 4));
  out.push(line(x + 5, y + 6, x + w - 5, y + 6, 'p-s'));
  const lines = dense ? 4 : 3;
  for (let i = 0; i < lines; i += 1) {
    const ly = y + 14 + i * 8;
    out.push(line(x + 5, ly, x + 5 + (0.4 + rng() * 0.5) * (w - 10), ly, 'p-d'));
  }
  out.push(circ(x + w - 5, y + 5, 1.6, 'p-af'));
  return out.join('');
};

const gVerdict: Gen = (rng, _dense) => {
  const out: string[] = [];
  const cx = W / 2;
  const cy = H / 2;
  const R = 20;
  out.push(circ(cx, cy, R, 'p-s'));
  out.push(circ(cx, cy, R * 0.55, 'p-d'));
  const m = 6;
  const corners: Array<[number, number, number, number]> = [
    [PAD, PAD, 1, 1], [W - PAD, PAD, -1, 1], [PAD, H - PAD, 1, -1], [W - PAD, H - PAD, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    out.push(line(x, y, x + m * sx, y, 'p-s'));
    out.push(line(x, y, x, y + m * sy, 'p-s'));
  }
  const a0 = rng() * TAU;
  const a1 = a0 + Math.PI * 0.5;
  out.push(path(
    `M ${nn(cx + R * Math.cos(a0))} ${nn(cy + R * Math.sin(a0))} A ${R} ${R} 0 0 1 ${nn(cx + R * Math.cos(a1))} ${nn(cy + R * Math.sin(a1))}`,
    'p-a',
  ));
  return out.join('');
};

const gTermtools: Gen = (rng, dense) => {
  const out: string[] = [];
  const rootX = PAD + 4;
  const rootY = H / 2;
  const leaves = dense ? 7 : 5;
  const midX = rootX + 18;
  for (let i = 0; i < leaves; i += 1) {
    const ly = PAD + (i * (H - 2 * PAD)) / (leaves - 1);
    const lx = W - PAD - rng() * 10;
    out.push(path(`M ${nn(rootX + 3)} ${nn(rootY)} C ${nn(midX)} ${nn(rootY)}, ${nn(midX)} ${nn(ly)}, ${nn(lx - 4)} ${nn(ly)}`, 'p-s'));
    out.push(circ(lx, ly, 1.3, 'p-df'));
  }
  out.push(circ(rootX, rootY, 2.6, 'p-af'));
  return out.join('');
};

const gBoard: Gen = (rng, dense) => {
  const out: string[] = [];
  const count = dense ? 8 : 6;
  const nodes: Array<[number, number]> = [];
  for (let i = 0; i < count; i += 1) nodes.push([rin(rng, PAD, W - PAD), rin(rng, PAD, H - PAD)]);
  for (let i = 0; i < count - 1; i += 1) {
    if (rng() < 0.6) out.push(line(nodes[i][0], nodes[i][1], nodes[i + 1][0], nodes[i + 1][1], 'p-s'));
  }
  for (const nd of nodes) out.push(circ(nd[0], nd[1], 1.4, 'p-df'));
  let cx = 0;
  let cy = 0;
  for (const nd of nodes) { cx += nd[0]; cy += nd[1]; }
  cx /= count;
  cy /= count;
  out.push(line(cx - 4, cy, cx + 4, cy, 'p-a'));
  out.push(line(cx, cy - 4, cx, cy + 4, 'p-a'));
  out.push(circ(cx, cy, 1.6, 'p-af'));
  return out.join('');
};

const gChecklist: Gen = (rng, dense) => {
  const out: string[] = [];
  const rows = dense ? 4 : 3;
  const amberRow = rint(rng, 0, rows - 1);
  const b = 4.5;
  for (let i = 0; i < rows; i += 1) {
    const y = PAD + (i * (H - 2 * PAD)) / (rows - 1);
    out.push(rect(PAD, y - b / 2, b, b, 'p-s'));
    if (rng() < 0.7 || i === amberRow) {
      out.push(path(`M ${nn(PAD + 1)} ${nn(y)} l 1.4 1.6 l 2.4 -3`, i === amberRow ? 'p-a' : 'p-d'));
    }
    out.push(line(PAD + b + 4, y, PAD + b + 4 + (0.4 + rng() * 0.45) * (W - 2 * PAD - b - 8), y, 'p-s'));
  }
  return out.join('');
};

const gSite: Gen = (rng, dense) => {
  const out: string[] = [];
  const x = PAD;
  const y = PAD;
  const w = W - 2 * PAD;
  const h = H - 2 * PAD;
  out.push(rect(x, y, w, h, 'p-s'));
  out.push(line(x, y + 8, x + w, y + 8, 'p-s'));
  out.push(rect(x + 4, y + 12, w * 0.5, h - 16, 'p-d'));
  const cols = dense ? 3 : 2;
  const cw = (w * 0.5 - 8) / cols;
  for (let i = 0; i < cols; i += 1) {
    out.push(rect(x + w * 0.5 + 2 + i * (cw + 2), y + 12, cw, h - 16, 'p-d'));
  }
  out.push(line(x + 4, y + 4, x + 14, y + 4, 'p-a'));
  return out.join('');
};

const gWorkshop: Gen = (rng, _dense) => {
  const out: string[] = [];
  const cols = 3;
  const rows = 2;
  const gw = (W - 2 * PAD) / cols;
  const gh = (H - 2 * PAD) / rows;
  const keyI = rint(rng, 0, cols * rows - 1);
  let idx = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const bx = PAD + c * gw + 1;
      const by = PAD + r * gh + 1;
      const bw = gw - 2;
      const bh = gh - 2;
      if (idx === keyI) {
        out.push(rect(bx, by, bw, bh, 'p-a'));
        out.push(rect(bx + bw * 0.3, by + bh * 0.3, bw * 0.4, bh * 0.4, 'p-a'));
      } else {
        out.push(rect(bx, by, bw, bh, rng() < 0.5 ? 'p-s' : 'p-d'));
      }
      idx += 1;
    }
  }
  return out.join('');
};

const GEN: Record<string, Gen> = {
  terminal: gTerminal,
  console: gConsole,
  statustable: gTable,
  phone: gPhone,
  verdict: gVerdict,
  termtools: gTermtools,
  board: gBoard,
  checklist: gChecklist,
  site: gSite,
  workshop: gWorkshop,
};

export function plateArtSvg(project: PortfolioProject, opts: { compact?: boolean } = {}): string {
  const art = project.art ?? 'board';
  const gen = GEN[art] ?? gBoard;
  const rng = mulberry32(seedFrom(`${project.id}:${art}`));
  const inner = gen(rng, !opts.compact);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="presentation" focusable="false">${inner}</svg>`;
}

export function plateSigilSvg(id: string): string {
  const rng = mulberry32(seedFrom(`${id}:sigil`));
  const S = 28;
  const cx = S / 2;
  const cy = S / 2;
  const out: string[] = [];
  const spokes = rint(rng, 3, 5);
  for (let i = 0; i < spokes; i += 1) {
    const a = rng() * TAU;
    const r1 = 3 + rng() * 3;
    const r2 = 8 + rng() * 4;
    out.push(line(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a) * r2, cy + Math.sin(a) * r2, 'p-s'));
  }
  out.push(circ(cx, cy, 1.6, 'p-af'));
  return `<svg viewBox="0 0 ${S} ${S}" preserveAspectRatio="xMidYMid meet" role="presentation" focusable="false">${out.join('')}</svg>`;
}
