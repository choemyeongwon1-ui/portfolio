// ==========================================
// 꽃피는 나무 그리기 (캔버스)
// ------------------------------------------
// 수채화 그림 속 활엽수 수형을 따른다.
//   곧은 줄기 하나 → 위에서 다섯 갈래로 갈라지는 굵은 가지 → 잔가지
//   → 잔가지 끝마다 낱낱의 잎이 모여 달린 둥근 수관(돔)
// 가지가 수관 밖으로 나가지 못하게 타원 안에서만 자라게 해서 둥근 모양이 유지된다.
//
//  - createShrub(seed): 가지·잎·꽃의 위치와 "언제 자라는지"(0~1 시각)를 한 번 계산한다
//  - createSprites():   잎·꽃 그림 조각을 미리 수채화 질감으로 그려 둔다
//  - drawShrub(...):    진행도 p(0~1)에 맞춰 그린다. p=1 이면 활짝 핀 모습이다.
//
// 계절: drawShrub 의 opts.season = { autumn, fall, snow } (각 0~1)
//   autumn  잎이 노랑→주황→빨강으로 물들고 꽃은 시든다
//   fall    잎이 하나씩 떨어져 땅에 쌓인다
//   snow    가지와 땅에 눈이 쌓인다 (내리는 눈송이는 CSS 층이 맡는다)
//
// 진행도 구간 (대략):
//   0.00~0.10  씨앗이 떨어져 땅에 묻힌다
//   0.08~0.66  줄기가 오르고 가지가 갈라지며 잎이 돋는다
//   0.60~1.00  가지 끝마다 꽃눈이 맺혔다가 하나씩 핀다 (꽃은 잎 위에 그려진다)
// ==========================================

const TAU = Math.PI * 2;
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const span = (p, a, b) => clamp((p - a) / (b - a));
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeIn = (t) => t * t;

export const WORLD = 1000; // 그림 좌표계 한 변
export const SOIL_Y = 900; // 땅 높이

// 수관(돔): 이 타원 안에서만 가지가 자란다
const CROWN = { cx: 500, cy: 430, rx: 335, ry: 305 };
const inCrown = (x, y, k = 1) => {
  if (y > 650) return true;
  const dx = (x - CROWN.cx) / (CROWN.rx * k);
  const dy = (y - CROWN.cy) / (CROWN.ry * k);
  return dx * dx + dy * dy <= 1;
};

function rng32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEAF_TONES = 8; // 0 = 가장 밝은 노란 연두 … 7 = 가장 짙은 청록

/* ---------- 나무 구조 만들기 ---------- */

export function createShrub(seed = 1) {
  const rnd = rng32(seed * 7919 + 101);
  const R = (a, b) => a + (b - a) * rnd();

  const branches = [];
  const leaves = [];
  const clusters = [];

  // 깊이: 0 줄기 · 1 굵은 가지 · 2 가지 · 3 잔가지
  const DUR = [0.26, 0.2, 0.14, 0.09];
  const FRACS = [[], [0.32, 0.5, 0.68, 0.86, 1], [0.4, 0.7, 1], []];

  // 위치에 따른 잎 색: 위쪽·왼쪽 바깥은 노란 연두, 안쪽·오른쪽 아래는 짙은 청록
  const toneAt = (x, y) => {
    const d = Math.hypot((x - CROWN.cx) / CROWN.rx, (y - CROWN.cy) / CROWN.ry);
    const t = 0.42 + (x - CROWN.cx) * 0.00075 + (y - CROWN.cy) * 0.00085 + (1 - clamp(d)) * 0.3 + R(-0.22, 0.22);
    return Math.min(LEAF_TONES - 1, Math.floor(clamp(t) * LEAF_TONES));
  };

  const addLeaf = (x, y, ang, len, t) => {
    leaves.push({ x, y, ang, len, t, sprite: toneAt(x, y), flip: rnd() < 0.5 ? -1 : 1, tone: R(0.62, 1), ph: R(0, TAU), sp: R(1.1, 2.1),
      ao: R(0, 0.55), // 단풍 드는 시점이 잎마다 다르다
      au: 0, // 아래에서 정한다
      fo: R(0, 0.75), // 떨어지기 시작하는 시점
      fx: R(-110, 110) + (x - 500) * 0.15, // 떨어지며 흘러가는 거리
      gy: SOIL_Y + R(-8, 28), // 내려앉는 땅 높이
      gr: R(-0.55, 0.55) + (rnd() < 0.5 ? 0 : Math.PI),
      fs: R(-3, 3) });
    const lf = leaves[leaves.length - 1];
    lf.au = Math.max(0, Math.min(7, Math.round((lf.sprite / 7) * 5 + R(-1.5, 2.5))));
  };

  function branch(x, y, ang, len, w, depth, t0) {
    const dur = DUR[depth] * (depth === 0 ? 1 : R(0.85, 1.2));
    const step = 11;
    const n0 = Math.max(4, Math.round(len / step));
    const pts = [{ x, y, a: ang }];
    let a = ang;

    for (let i = 1; i <= n0; i++) {
      a += (rnd() - 0.5) * (depth === 0 ? 0.05 : 0.2);
      // 굵은 가지는 처음엔 바깥으로 뻗다가 점점 위로 휜다
      if (depth >= 1 && i > n0 * 0.28) {
        const diff = Math.atan2(Math.sin(-Math.PI / 2 - a), Math.cos(-Math.PI / 2 - a));
        a += diff * (depth === 1 ? 0.07 : 0.05);
      }
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      if (!inCrown(x, y, depth >= 2 ? 0.97 : 0.9)) break; // 수관 밖으로는 자라지 않는다
      pts.push({ x, y, a });
    }

    const n = pts.length - 1;
    if (n < 2) return null;

    const b = { pts, w, depth, t0, dur, t1: t0 + dur };
    branches.push(b);

    // 가지 곳곳에 한두 장 (안쪽이 비치도록 드문드문)
    if (depth >= 2) {
      for (let i = Math.floor(n * 0.4); i < n; i += 2) {
        if (rnd() < 0.35) continue;
        addLeaf(pts[i].x, pts[i].y, pts[i].a + R(-1.4, 1.4), R(30, 46), t0 + dur * (i / n));
      }
    }

    // 가지 끝: 낱낱의 잎이 둥글게 모여 달린다
    const tip = pts[n];
    const tuft = depth === 3 ? Math.round(R(6, 9)) : depth === 2 ? Math.round(R(3, 5)) : depth === 1 ? 2 : 0;
    for (let k = 0; k < tuft; k++) {
      const spread = depth === 3 ? 1.5 : 1.2;
      addLeaf(
        tip.x + R(-14, 14),
        tip.y + R(-14, 14),
        tip.a + R(-spread, spread) + (k % 2 ? 0.2 : -0.2),
        R(34, 54),
        t0 + dur * R(0.88, 1)
      );
    }

    // 곁가지
    if (depth < 3) {
      let side = rnd() < 0.5 ? -1 : 1;
      for (const f of FRACS[depth]) {
        const p0 = pts[Math.min(n, Math.round(f * n))];
        const tipSplit = f === 1;
        const offset = tipSplit ? R(0.3, 0.55) : R(0.55, 0.95);
        const childLen = len * R(0.52, 0.7) * (tipSplit ? 1 : 1 - f * 0.25);
        branch(p0.x, p0.y, p0.a + side * offset, childLen, w * 0.58, depth + 1, t0 + dur * f + 0.003);
        side = -side;
        if (tipSplit && depth === 1) {
          branch(p0.x, p0.y, p0.a + side * R(0.25, 0.5), childLen * 0.85, w * 0.52, depth + 1, t0 + dur + 0.003);
        }
      }
    }

    // 꽃: 잔가지 끝 일부에 소복이
    if (depth === 3 && rnd() < 0.4) {
      const r = R(15, 26);
      const count = Math.round(R(4, 7));
      const florets = [];
      for (let k = 0; k < count; k++) {
        const rr = r * Math.sqrt((k + 0.5) / count);
        const th = k * 2.39996 + R(-0.25, 0.25);
        florets.push({
          dx: Math.cos(th) * rr,
          dy: Math.sin(th) * rr * 0.85 - r * 0.15,
          size: R(15, 22) * (1.15 - 0.4 * (rr / r)),
          rot: R(0, TAU),
          delay: R(0, 1)
        });
      }
      florets.sort((p, q) => Math.hypot(q.dx, q.dy) - Math.hypot(p.dx, p.dy));
      clusters.push({ x: tip.x, y: tip.y - 6, branchEnd: b.t1, florets });
    }

    return b;
  }

  // 줄기 하나가 곧게 올라와 위에서 다섯 갈래로 갈라진다
  const trunk = branch(500, SOIL_Y + 6, -Math.PI / 2 + R(-0.03, 0.03), 255, 46, 0, 0.1);
  const top = trunk.pts[trunk.pts.length - 1];
  const spreads = [-0.82, -0.4, 0.04, 0.44, 0.84];
  spreads.forEach((offset, i) => {
    const len = (i === 2 ? 300 : i === 1 || i === 3 ? 280 : 240) * R(0.92, 1.08);
    branch(top.x + R(-6, 6), top.y + R(-4, 4), -Math.PI / 2 + offset + R(-0.07, 0.07), len, 19, 1, trunk.t1 - 0.01 + i * 0.006);
  });

  // 계산된 시각을 0.08~0.66 구간에 맞춰 늘이거나 줄인다 (가지가 다 자란 뒤 꽃이 핀다)
  const rawMax = Math.max(...branches.map((b) => b.t1));
  const k = (0.66 - 0.08) / (rawMax - 0.08);
  const map = (t) => 0.08 + (t - 0.08) * k;
  for (const b of branches) {
    b.t0 = map(b.t0);
    b.t1 = map(b.t1);
    b.dur = b.t1 - b.t0;
  }
  for (const l of leaves) l.t = map(l.t);
  for (const c of clusters) {
    c.branchEnd = map(c.branchEnd);
    c.t = clamp(Math.max(c.branchEnd + 0.04, 0.6) + rnd() * 0.26, 0, 0.88);
  }

  // 줄기 아래 풀 몇 가닥
  const grass = [];
  const palette = ['#7fa05a', '#9ab86a', '#8fae62', '#b3c97e'];
  for (let i = 0; i < 22; i++) {
    grass.push({
      x: 500 + R(-70, 70),
      h: R(18, 46),
      bend: R(-16, 16),
      w: R(1.2, 2.4),
      c: palette[Math.floor(R(0, palette.length))]
    });
  }

  const ground = [];
  const wash = [[126, 154, 78], [98, 130, 66], [160, 138, 88], [176, 184, 104], [110, 140, 72]];
  for (let i = 0; i < 11; i++) {
    const col = wash[Math.floor(R(0, wash.length))];
    ground.push({ x: 500 + R(-250, 250), y: SOIL_Y + R(2, 18), rx: R(46, 150), ry: R(7, 15), rot: R(-0.12, 0.12), a: R(0.16, 0.3), col });
  }

  return { branches, leaves, clusters, grass, ground };
}

/* ---------- 수채화 질감 도우미 ---------- */

function h2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  return ((h >>> 0) % 10000) / 10000;
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const s = (t) => t * t * (3 - 2 * t);
  const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
  const u = s(xf), w = s(yf);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
}

/** 종이 결: 알파를 미세하게 흔들어 물감이 종이 오목한 곳에 고인 듯 보이게 한다. */
function granulate(c, amount = 0.35, freq = 0.6) {
  const w = c.width, h = c.height;
  const x = c.getContext('2d');
  const img = x.getImageData(0, 0, w, h);
  const d = img.data;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const o = (py * w + px) * 4 + 3;
      if (!d[o]) continue;
      const n = vnoise(px * freq, py * freq) * 0.55 + h2(px, py) * 0.45;
      d[o] = Math.min(255, d[o] * (1 - amount + amount * 1.7 * n));
    }
  }
  x.putImageData(img, 0, 0);
}

const soften = (x, px) => { if ('filter' in x) x.filter = `blur(${px}px)`; };
const sharp = (x) => { if ('filter' in x) x.filter = 'none'; };

/* ---------- 그림 조각(스프라이트) ---------- */

// 밝은 노란 연두 → 짙은 청록 (수채화 속 잎 색)
const LEAF_COLORS = [
  ['#f6f7bf', '#e2eb9e'], ['#e8f0a8', '#cfe287'], ['#d9eba0', '#b8d98a'], ['#c6e3a0', '#a0cf8e'],
  ['#b2d8a0', '#8fc297'], ['#9fcfa0', '#7db797'], ['#8ac4a0', '#6cac92'], ['#78b99a', '#5d9f88']
];

// 단풍: 노란 은행빛 → 주황 → 붉은 갈색 (수채화로 옅게)
const AUTUMN_COLORS = [
  ['#fbeaa0', '#efcf70'], ['#f8dc82', '#eab85a'], ['#f5c872', '#e3a14a'], ['#f0b061', '#dc8a42'],
  ['#ea9a58', '#d3703a'], ['#e3814e', '#c85a34'], ['#d96a45', '#b9482e'], ['#cd5a3d', '#a43d2b']
];

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function createSprites() {
  // 잎: 달걀꼴, 반투명, 가장자리에 물감이 고임
  const makeLeaf = ([c0, c1]) => {
    const c = canvas(128, 72);
    const x = c.getContext('2d');
    const shape = () => {
      x.beginPath();
      x.moveTo(4, 36);
      x.bezierCurveTo(8, 6, 66, 2, 124, 36);
      x.bezierCurveTo(66, 70, 8, 66, 4, 36);
      x.closePath();
    };
    soften(x, 0.7);
    const g = x.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    x.globalAlpha = 0.5;
    x.fillStyle = g;
    shape();
    x.fill();
    // 한쪽으로 물감이 몰린 듯
    x.globalAlpha = 0.1;
    x.fillStyle = c1;
    x.beginPath();
    x.moveTo(4, 36);
    x.bezierCurveTo(8, 66, 66, 70, 124, 36);
    x.closePath();
    x.fill();
    x.globalAlpha = 0.34;
    x.strokeStyle = c1;
    x.lineWidth = 1.5;
    shape();
    x.stroke();
    x.globalAlpha = 0.28;
    x.strokeStyle = '#fffbe6';
    x.lineWidth = 1.2;
    x.beginPath();
    x.moveTo(8, 36);
    x.quadraticCurveTo(60, 34, 108, 36);
    x.stroke();
    sharp(x);
    granulate(c, 0.38, 0.7);
    return c;
  };
  const leaf = LEAF_COLORS.map(makeLeaf);
  const autumn = AUTUMN_COLORS.map(makeLeaf);

  // 꽃: 반투명한 꽃잎 다섯 장, 가장자리에 분홍 물감이 고임, 노란 꽃술
  const floret = canvas(96, 96);
  {
    const x = floret.getContext('2d');
    x.translate(48, 48);
    soften(x, 3);
    x.fillStyle = 'rgba(96, 120, 132, 0.12)';
    x.beginPath();
    x.ellipse(2, 4, 36, 33, 0, 0, TAU);
    x.fill();
    soften(x, 0.7);
    for (let i = 0; i < 5; i++) {
      x.save();
      x.rotate((i * TAU) / 5 + (i % 2 ? 0.07 : -0.05));
      const petal = () => {
        x.beginPath();
        x.moveTo(0, -3);
        x.bezierCurveTo(-21, -9, -24, -36, -6, -43);
        x.quadraticCurveTo(0, -39, 6, -43);
        x.bezierCurveTo(24, -36, 21, -9, 0, -3);
      };
      const g = x.createRadialGradient(0, -6, 3, 0, -24, 28);
      g.addColorStop(0, 'rgba(255, 249, 241, 0.72)');
      g.addColorStop(0.6, 'rgba(255, 253, 250, 0.52)');
      g.addColorStop(1, 'rgba(246, 214, 224, 0.58)');
      x.fillStyle = g;
      petal();
      x.fill();
      x.strokeStyle = 'rgba(228, 160, 184, 0.42)';
      x.lineWidth = 1.3;
      petal();
      x.stroke();
      x.restore();
    }
    x.fillStyle = 'rgba(238, 204, 90, 0.8)';
    x.beginPath();
    x.arc(0, 0, 7.5, 0, TAU);
    x.fill();
    x.fillStyle = 'rgba(218, 160, 60, 0.7)';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.3;
      x.beginPath();
      x.arc(Math.cos(a) * 11, Math.sin(a) * 11, 1.8, 0, TAU);
      x.fill();
    }
    sharp(x);
    granulate(floret, 0.3, 0.8);
  }

  // 꽃눈
  const bud = canvas(48, 48);
  {
    const x = bud.getContext('2d');
    soften(x, 0.8);
    const g = x.createRadialGradient(22, 21, 1, 24, 24, 13);
    g.addColorStop(0, 'rgba(255, 252, 244, 0.95)');
    g.addColorStop(0.7, 'rgba(240, 232, 214, 0.9)');
    g.addColorStop(1, 'rgba(206, 214, 160, 0.9)');
    x.fillStyle = g;
    x.beginPath();
    x.arc(24, 24, 12, 0, TAU);
    x.fill();
    x.strokeStyle = 'rgba(200, 150, 160, 0.5)';
    x.lineWidth = 1.2;
    x.stroke();
    sharp(x);
    granulate(bud, 0.3, 0.8);
  }

  return { leaf, autumn, floret, bud };
}

/* ---------- 그리기 ---------- */

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const YOUNG = [176, 202, 140];
const WOOD_THICK = [168, 138, 104];
const WOOD_THIN = [176, 150, 116];

/** 땅: 수채화로 번진 풀빛·흙빛 얼룩과 풀 몇 가닥 */
function drawGround(ctx, shrub, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const g of shrub.ground) {
    ctx.fillStyle = `rgba(${g.col[0]}, ${g.col[1]}, ${g.col[2]}, ${g.a})`;
    ctx.beginPath();
    ctx.ellipse(g.x, g.y, g.rx, g.ry, g.rot, 0, TAU);
    ctx.fill();
  }
  ctx.lineCap = 'round';
  ctx.globalAlpha = alpha * 0.7;
  for (const b of shrub.grass) {
    ctx.strokeStyle = b.c;
    ctx.lineWidth = b.w;
    ctx.beginPath();
    ctx.moveTo(b.x, SOIL_Y + 8);
    ctx.quadraticCurveTo(b.x + b.bend * 0.3, SOIL_Y - b.h * 0.5, b.x + b.bend, SOIL_Y - b.h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSeed(ctx, p) {
  const fall = easeIn(span(p, 0, 0.1));
  const buried = span(p, 0.1, 0.16);
  if (buried >= 1) return;
  const y = 40 + (SOIL_Y - 8 - 40) * fall;

  const ripple = span(p, 0.1, 0.17);
  if (ripple > 0 && ripple < 1) {
    ctx.save();
    ctx.strokeStyle = `rgba(74, 120, 168, ${(1 - ripple) * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(500, SOIL_Y + 6, 14 + ripple * 90, 4 + ripple * 14, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = (1 - buried) * 0.92;
  ctx.translate(500, y);
  ctx.rotate(0.25);
  const g = ctx.createLinearGradient(-8, -12, 8, 12);
  g.addColorStop(0, '#d2b27c');
  g.addColorStop(1, '#7a5a38');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8.5, 13, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** 굵은 가지: 폭이 줄어드는 한 장의 도형 + 그늘·빛 가장자리 */
function drawBody(ctx, b, upTo, c, maturity, g) {
  const count = b.pts.length - 1;
  const pts = [];
  for (let i = 0; i <= Math.floor(upTo); i++) pts.push(b.pts[i]);
  if (upTo % 1) {
    const i0 = Math.floor(upTo), f = upTo - i0;
    const a = b.pts[i0], z = b.pts[Math.min(count, i0 + 1)];
    pts.push({ x: a.x + (z.x - a.x) * f, y: a.y + (z.y - a.y) * f });
  }
  const m = pts.length;
  if (m < 2) return;

  const edges = (scale) => {
    const left = [], right = [];
    for (let i = 0; i < m; i++) {
      const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(m - 1, i + 1)];
      let tx = next.x - prev.x, ty = next.y - prev.y;
      const L = Math.hypot(tx, ty) || 1;
      tx /= L; ty /= L;
      let hw = Math.max(0.7, b.w * (1 - 0.45 * (i / count)) * 0.5) * Math.min(1, g * 4) * scale;
      if (b.depth === 0) hw *= 1 + 0.9 * Math.exp(-i * 0.7); // 줄기 밑동은 살짝 퍼진다
      left.push([pts[i].x - ty * hw, pts[i].y + tx * hw]);
      right.push([pts[i].x + ty * hw, pts[i].y - tx * hw]);
    }
    return { left, right };
  };
  const polygon = (e) => {
    ctx.beginPath();
    e.left.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    for (let i = e.right.length - 1; i >= 0; i--) ctx.lineTo(e.right[i][0], e.right[i][1]);
    ctx.closePath();
  };
  const line = (arr) => {
    ctx.beginPath();
    arr.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  };
  const rgb = (k, a) => `rgba(${(c[0] * k) | 0},${(c[1] * k) | 0},${(c[2] * k) | 0},${a})`;

  // 번진 물감: 조금 더 넓고 옅게 한 겹, 그 위에 본체
  ctx.fillStyle = rgb(1, 0.22);
  polygon(edges(1.25));
  ctx.fill();
  ctx.fillStyle = rgb(0.97, 0.6);
  const body = edges(1);
  polygon(body);
  ctx.fill();

  // 그늘 쪽(오른쪽)은 진하게, 빛 쪽(왼쪽)은 밝게
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = rgb(0.7, 0.4);
  ctx.lineWidth = Math.max(1, b.w * 0.12);
  line(body.right);
  if (b.depth === 0) {
    ctx.strokeStyle = `rgba(240, 220, 176, ${0.5 * maturity})`;
    ctx.lineWidth = Math.max(1, b.w * 0.1);
    line(body.left);
  }
}

/** 가지: 어린 가지는 연두, 자라며 갈색으로 굳는다 */
function drawBranch(ctx, b, p) {
  const g = easeOut(span(p, b.t0, b.t1));
  if (g <= 0) return;

  const count = b.pts.length - 1;
  const upTo = g * count;
  const maturity = span(p, b.t1, b.t1 + 0.3);
  const wood = b.depth <= 1 ? WOOD_THICK : WOOD_THIN;
  const c = mix(YOUNG, wood, maturity);

  if (b.depth <= 1) {
    drawBody(ctx, b, upTo, c, maturity, g);
    return;
  }

  // 잔가지: 끊김 없는 한 줄
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = `rgba(${(c[0] * 0.88) | 0},${(c[1] * 0.88) | 0},${(c[2] * 0.88) | 0},0.5)`;
  ctx.lineWidth = Math.max(1, b.w * 0.8) * Math.min(1, g * 4);
  ctx.beginPath();
  ctx.moveTo(b.pts[0].x, b.pts[0].y);
  for (let i = 1; i <= Math.floor(upTo); i++) ctx.lineTo(b.pts[i].x, b.pts[i].y);
  if (upTo % 1) {
    const i0 = Math.floor(upTo), f = upTo - i0;
    const a = b.pts[i0], z = b.pts[Math.min(count, i0 + 1)];
    ctx.lineTo(a.x + (z.x - a.x) * f, a.y + (z.y - a.y) * f);
  }
  ctx.stroke();
}

/**
 * 바람: 높이 있는 잎일수록 많이 흔들린다. 줄기와 땅 가까운 잎은 거의 가만히 있다.
 *  - 잔잔한 바람: 잎마다 박자가 달라서 한꺼번에 움직이지 않고 물결치듯 이어진다
 *  - 돌풍(gust): 스크롤하는 방향으로 잎이 한쪽으로 쏠린다
 */
function windAt(y, time, phase, speed, gust) {
  const lift = clamp((SOIL_Y - y) / 560);
  return lift * (Math.sin(time * speed + phase) * 0.16 + Math.sin(time * 0.7 + phase * 0.5) * 0.07 + gust * 0.34);
}

function drawLeaf(ctx, sprites, l, p, time = 0, gust = 0, season = NO_SEASON) {
  const u = easeOut(span(p, l.t, l.t + 0.09));
  if (u <= 0) return;

  // 물드는 정도 (잎마다 시점이 다르다)
  const a = clamp((season.autumn * 1.6 - l.ao) / 0.6);
  // 떨어지는 정도
  const q = clamp((season.fall - l.fo) / 0.25);

  const s = (l.len * (0.3 + 0.7 * u)) / 128;
  let x = l.x, y = l.y, ang = l.ang + windAt(l.y, time, l.ph, l.sp, gust), flat = 1, alpha = clamp(u * 1.5) * l.tone;

  if (q > 0) {
    // 흔들리며 내려와 땅에 눕는다
    const e = q * q * (3 - 2 * q) * 0.35 + q * q * 0.65;
    y = l.y + (l.gy - l.y) * e;
    x = l.x + l.fx * q + Math.sin(q * 7 + l.ph) * 30 * q * (1 - 0.5 * q) + gust * 40 * q;
    ang = l.ang + l.fs * q * 2.2 + (l.gr - l.ang) * easeOut(clamp((q - 0.7) / 0.3));
    flat = 1 - 0.28 * easeOut(clamp((q - 0.75) / 0.25)); // 땅에 닿으면 납작하게
    alpha *= clamp(1 - season.snow * 1.7); // 눈이 내리면 낙엽은 눈에 덮여 완전히 사라진다
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s * l.flip * flat);
  if (a < 1) {
    ctx.globalAlpha = alpha * (1 - a);
    ctx.drawImage(sprites.leaf[l.sprite], 0, -36);
  }
  if (a > 0) {
    ctx.globalAlpha = alpha * a;
    ctx.drawImage(sprites.autumn[l.au], 0, -36);
  }
  ctx.restore();
}

function drawCluster(ctx, sprites, c, p, time = 0, gust = 0, wither = 1) {
  if (wither <= 0) return;
  // 꽃송이는 가지 끝에서 살짝 흔들린다 (위치만, 줄기는 그대로)
  const sway = windAt(c.y, time, c.x * 0.05, 1.5, gust) * 38;
  for (const f of c.florets) {
    const start = c.t + f.delay * 0.1;
    const u = span(p, start, start + 0.09);
    if (u <= 0) continue;

    ctx.save();
    ctx.translate(c.x + f.dx + sway, c.y + f.dy);
    ctx.rotate(f.rot);

    // 꽃눈 → 활짝 핀 꽃
    const budPart = 1 - span(u, 0.25, 0.5);
    const bloom = easeOut(span(u, 0.25, 1));
    if (budPart > 0) {
      const s = (f.size * 0.5 * (0.5 + u)) / 48;
      ctx.globalAlpha = budPart * wither;
      ctx.save();
      ctx.scale(s, s);
      ctx.drawImage(sprites.bud, -24, -24);
      ctx.restore();
    }
    if (bloom > 0) {
      const s = (f.size * (0.25 + 0.75 * bloom)) / 48;
      ctx.globalAlpha = clamp(bloom * 1.6) * wither;
      ctx.scale(s, s);
      ctx.drawImage(sprites.floret, -48, -48);
    }
    ctx.restore();
  }
}

/** 눈: 땅에 소복이 쌓이고, 가지 윗면에 얹힌다 */
function drawSnow(ctx, shrub, snow) {
  if (snow <= 0) return;
  const e = easeOut(snow);
  ctx.save();

  // 가지 위에 쌓인 눈 (위를 향한 면에만)
  ctx.lineCap = 'round';
  for (const b of shrub.branches) {
    if (b.depth > 2) continue;
    const n = b.pts.length - 1;
    for (let i = 1; i <= n; i++) {
      const p0 = b.pts[i - 1], p1 = b.pts[i];
      const flat = Math.abs(Math.cos(p1.a));
      if (flat < 0.3) continue;
      const taper = 1 - 0.5 * (i / n);
      const w = Math.max(1.2, b.w * taper * 0.55) * flat * e;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * e})`;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y - b.w * taper * 0.32);
      ctx.lineTo(p1.x, p1.y - b.w * taper * 0.32);
      ctx.stroke();
    }
  }

  // 땅의 눈더미: 푸른 그늘 위에 흰 덩어리를 몇 겹
  const lumps = [[500, -8, 1], [405, 0, 0.78], [612, -2, 0.8], [310, 8, 0.52], [706, 7, 0.55], [452, -14, 0.7], [556, -12, 0.66], [350, 2, 0.6], [660, 2, 0.6]];
  for (const [lx, ly, sc] of lumps) {
    const rx = (70 + 190 * e) * sc, ry = (3 + 52 * e) * sc;
    ctx.fillStyle = 'rgba(178, 198, 222, 0.5)';
    ctx.beginPath();
    ctx.ellipse(lx + 5, SOIL_Y + 10 + ly + 3, rx, ry * 0.95, 0, 0, TAU);
    ctx.fill();
  }
  for (const [lx, ly, sc] of lumps) {
    const rx = (70 + 190 * e) * sc, ry = (3 + 52 * e) * sc;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    ctx.ellipse(lx, SOIL_Y + 6 + ly, rx, ry, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

const NO_SEASON = { autumn: 0, fall: 0, snow: 0 };

/**
 * @param {CanvasRenderingContext2D} ctx  (WORLD×WORLD 좌표계가 이미 맞춰져 있어야 한다)
 * @param {number} p 0~1 (자라는 정도)
 * @param {{ground?: boolean, time?: number, gust?: number, season?: {autumn:number, fall:number, snow:number}}} [opts]
 */
export function drawShrub(ctx, shrub, sprites, p, opts = {}) {
  const { ground = true, time = 0, gust = 0, season = NO_SEASON } = opts;

  if (ground) drawGround(ctx, shrub, clamp(0.3 + p * 4) * 0.85);
  drawSeed(ctx, p);

  for (const b of shrub.branches) drawBranch(ctx, b, p);
  // 잎을 모두 먼저 그리고, 꽃송이는 그 위에 올린다. 눈은 맨 위.
  for (const l of shrub.leaves) drawLeaf(ctx, sprites, l, p, time, gust, season);
  const wither = 1 - clamp(season.autumn * 3);
  for (const c of shrub.clusters) drawCluster(ctx, sprites, c, p, time, gust, wither);
  drawSnow(ctx, shrub, season.snow);
}
