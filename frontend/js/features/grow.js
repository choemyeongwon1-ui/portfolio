// ==========================================
// 성장 무대 — 스크롤 진행도(0~1)가 곧 한 해의 흐름
// ------------------------------------------
//   파종 → 발아 → 줄기 → 가지 → 꽃눈 → 개화   (진행도 0 ~ 0.46: 나무가 자란다)
//   단풍   잎이 노랑·주황·빨강으로 물든다           (0.46 ~ 0.66)
//   낙엽   잎이 하나씩 떨어져 땅에 쌓인다           (0.60 ~ 0.86)
//   눈     눈이 내려 가지와 땅에 쌓인다             (0.80 ~ 1.0)
// 나무는 캔버스에 직접 그린다 (js/lib/shrub.js). 큰 글자 띠는 반대 방향으로 흐르고,
// 오른쪽 아래 수치도 같은 진행도에서 나오므로 화면에 그려진 상태와 항상 일치한다.
//
// 'js' 클래스가 없으면(모션 줄이기·JS 없음) 아무것도 건드리지 않아
// HTML에 들어 있는 활짝 핀 그림이 그대로 보인다.
// ==========================================

import { $ } from '../lib/dom.js';
import { createShrub, createSprites, drawShrub, WORLD } from '../lib/shrub.js';

const pad2 = (n) => String(n).padStart(2, '0');

const STAGES = [
  [0.0, '파종', 'Sowing'],
  [0.05, '발아', 'Germination'],
  [0.1, '줄기', 'Stem'],
  [0.18, '가지', 'Branch'],
  [0.28, '꽃눈', 'Bud'],
  [0.37, '개화', 'Bloom'],
  [0.5, '단풍', 'Autumn'],
  [0.66, '낙엽', 'Falling'],
  [0.86, '눈 쌓임', 'Snow']
];

// 진행도 구간
const GROW_END = 0.46;
const seg = (v, a, b) => Math.min(1, Math.max(0, (v - a) / (b - a)));

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export function initGrow() {
  if (!document.documentElement.classList.contains('js')) return null;

  const section = $('#grow');
  const art = $('#growArt');
  const canvas = $('#growCanvas');
  if (!section || !art || !canvas) return null;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const shrub = createShrub(7);
  const sprites = createSprites();
  const marquee = $('.marquee', section);
  const pctEl = $('#growPct');
  const stageEl = $('#growStage');

  let lastP = -1;
  let lastText = '';

  // 바람: 시간과 돌풍(스크롤 속도)으로 잎·꽃만 흔든다
  let currentP = 0;
  let currentSeason = { autumn: 0, fall: 0, snow: 0 };
  let gust = 0;
  let gustTarget = 0;
  let visible = true;
  let windRunning = false;
  const t0 = performance.now();

  function paint(p, season = currentSeason) {
    const scale = canvas.width / WORLD;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawShrub(ctx, shrub, sprites, p, { ground: true, time: (performance.now() - t0) / 1000, gust, season });
  }

  // 화면에 보일 때만 계속 움직인다 (안 보일 땐 멈춰서 가볍게)
  function windLoop() {
    if (!visible) {
      windRunning = false;
      return;
    }
    gust += (gustTarget - gust) * 0.08; // 돌풍은 서서히 일었다가 가라앉는다
    gustTarget *= 0.94;
    paint(currentP);
    requestAnimationFrame(windLoop);
  }
  function startWind() {
    if (windRunning) return;
    windRunning = true;
    requestAnimationFrame(windLoop);
  }
  // 내리는 눈송이: 화면 전체에 걸쳐 천천히 떨어진다 (투명도는 --snow 가 정한다)
  const flakes = document.createElement('div');
  flakes.className = 'snowfall';
  flakes.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 70; i++) {
    const f = document.createElement('i');
    f.style.setProperty('--x', `${(Math.random() * 100).toFixed(1)}%`);
    f.style.setProperty('--s', `${(3 + Math.random() * 6).toFixed(1)}px`);
    f.style.setProperty('--dur', `${(9 + Math.random() * 10).toFixed(1)}s`);
    f.style.setProperty('--delay', `${(-Math.random() * 18).toFixed(1)}s`);
    f.style.setProperty('--dx', `${(-60 + Math.random() * 120).toFixed(0)}px`);
    flakes.append(f);
  }
  $('.grow-stage', section)?.append(flakes);

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) startWind();
    },
    { threshold: 0 }
  ).observe(section);

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.max(1, Math.round(art.clientWidth * dpr));
    if (canvas.width !== size) {
      canvas.width = size;
      canvas.height = size;
      lastP = -1; // 크기가 바뀌면 다시 그린다
    }
  }

  function update(p) {
    fit();

    // p 는 한 해 전체의 진행도. 자라는 정도와 계절로 나눠서 쓴다.
    const growth = seg(p, 0, GROW_END);
    currentSeason = {
      autumn: seg(p, GROW_END, 0.66),
      fall: seg(p, 0.6, 0.86),
      snow: seg(p, 0.8, 1)
    };
    currentP = growth;
    section.style.setProperty('--autumn', currentSeason.autumn.toFixed(3));
    section.style.setProperty('--snow', currentSeason.snow.toFixed(3));
    if (!windRunning && Math.abs(p - lastP) > 0.0004) {
      lastP = p;
      paint(growth);
    }

    // 큰 글자 띠는 반대 방향으로 흐른다.
    marquee?.style.setProperty('--mq', p.toFixed(4));

    // 수치 — 같은 p 에서 나온다.
    const pct = Math.round(p * 100);
    let stageIndex = 0;
    STAGES.forEach(([from], i) => {
      if (p >= from) stageIndex = i;
    });
    const [, ko, en] = STAGES[stageIndex];
    const text = `${pad2(stageIndex + 1)} / ${pad2(STAGES.length)} — ${ko} · ${en}`;

    if (pctEl && pctEl.textContent !== String(pct)) pctEl.textContent = String(pct);
    if (stageEl && text !== lastText) {
      stageEl.textContent = text;
      lastText = text;
    }
  }

  return {
    section,
    /** 섹션 안에서 스크롤이 얼마나 진행됐는지(0~1) */
    progress() {
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      return total > 0 ? clamp(-rect.top / total) : 1;
    },
    update,
    /** 스크롤이 빠를수록 센 돌풍이 분다 (나무 전체가 아니라 잎에만 닿는다) */
    lean(diff) {
      if (Math.abs(diff) > 0.0005) gustTarget = clamp(gustTarget + diff * 18, -1.4, 1.4);
    }
  };
}

/**
 * 스크롤 위치(목표)를 곧바로 쓰지 않고, 매 프레임 조금씩 따라가게 한다 (관성).
 * 휠을 한 칸씩 굴려도 식물과 글자가 끊기지 않고 미끄러지듯 자란다.
 * 'js' 클래스가 없으면(모션 줄이기) 아무것도 하지 않는다.
 */
export function initGrowScroll() {
  const grow = initGrow();
  if (!grow) return;

  let current = grow.progress();
  let running = false;

  const tick = () => {
    const target = grow.progress();
    const diff = target - current;
    // 멀수록 빠르게, 가까워지면 천천히 멈춘다
    current += diff * 0.04;
    if (Math.abs(diff) < 0.0003) current = target;
    grow.update(current);
    grow.lean(diff);

    if (current !== target) {
      requestAnimationFrame(tick);
    } else {
      running = false;
    }
  };
  const request = () => {
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  grow.update(current);
}
