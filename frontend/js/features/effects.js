// ==========================================
// 분위기를 만드는 작은 효과들
// ------------------------------------------
//  - 위쪽 스크롤 진행선
//  - 표지: 그림이 스크롤보다 천천히 따라오고, 마우스를 따라 햇살이 비친다
//  - 표지·성장 구역: 민들레 씨앗이 천천히 떠다닌다
//  - 카드: 마우스를 올리면 살짝 기울며 떠오른다
//
// 움직임은 모두 선택 사항이다. 'js' 클래스(모션 줄이기가 아닐 때만 붙음)가 없으면
// 진행선을 뺀 나머지는 켜지지 않는다.
// ==========================================

import { $, $$ } from '../lib/dom.js';

const motionOn = () => document.documentElement.classList.contains('js');
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** 위쪽 가는 진행선 */
function initProgress() {
  const bar = $('#scrollProgress');
  if (!bar) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? clamp(window.scrollY / max).toFixed(4) : '0');
  };
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );
  update();
}

/** 표지: 시차(parallax) + 마우스를 따라오는 햇살 */
function initHero() {
  const hero = $('#hero');
  if (!hero) return;

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    if (y < hero.offsetHeight * 1.3) hero.style.setProperty('--hy', `${(y * 0.22).toFixed(1)}px`);
  };
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    },
    { passive: true }
  );
  onScroll();

  // 햇살: 마우스를 천천히 뒤따른다 (바로 붙으면 번쩍거려서 거리를 조금씩 좁힌다)
  const light = { x: 0.72, y: 0.22, tx: 0.72, ty: 0.22, running: false };
  const step = () => {
    light.x += (light.tx - light.x) * 0.06;
    light.y += (light.ty - light.y) * 0.06;
    hero.style.setProperty('--mx', `${(light.x * 100).toFixed(2)}%`);
    hero.style.setProperty('--my', `${(light.y * 100).toFixed(2)}%`);
    if (Math.abs(light.tx - light.x) > 0.002 || Math.abs(light.ty - light.y) > 0.002) {
      requestAnimationFrame(step);
    } else {
      light.running = false;
    }
  };
  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    light.tx = clamp((event.clientX - rect.left) / rect.width);
    light.ty = clamp((event.clientY - rect.top) / rect.height);
    if (!light.running) {
      light.running = true;
      requestAnimationFrame(step);
    }
  });
}

/** 민들레 씨앗: 아래에서 위로 천천히 떠오르며 살랑인다 */
function initDrift() {
  const targets = [
    { el: $('#hero'), count: 9 },
    { el: $('.grow-stage'), count: 12 }
  ];

  for (const { el, count } of targets) {
    if (!el) continue;
    const layer = document.createElement('div');
    layer.className = 'drift';
    layer.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < count; i++) {
      const seed = document.createElement('i');
      seed.style.setProperty('--x', `${(Math.random() * 100).toFixed(1)}%`);
      seed.style.setProperty('--s', `${(16 + Math.random() * 18).toFixed(0)}px`);
      seed.style.setProperty('--dur', `${(26 + Math.random() * 22).toFixed(1)}s`);
      seed.style.setProperty('--delay', `${(-Math.random() * 40).toFixed(1)}s`);
      seed.style.setProperty('--dx', `${(-120 + Math.random() * 360).toFixed(0)}px`);
      layer.append(seed);
    }
    el.append(layer);
  }
}

/**
 * 낙엽: 가을 구간에서만, 화면 전체에 걸쳐 단풍잎이 흩날리며 내려온다.
 * 성장 무대(화면 크기로 고정되어 있는 구역) 안에 두고, 보이는 정도는 계절 진행도(--autumn, --snow)가 정한다:
 * 단풍이 들기 시작하면 나타나 낙엽 철에 가장 많고, 눈이 내리면 사라진다.
 * 다른 구역에는 나타나지 않는다.
 */
function leafSprite(c0, c1) {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>" +
    "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='" + c0 + "'/><stop offset='1' stop-color='" + c1 + "'/></linearGradient></defs>" +
    "<path d='M3 20 C6 3 34 1 62 20 C34 39 6 37 3 20 Z' fill='url(#g)' fill-opacity='.9'/>" +
    "<path d='M5 20 Q32 18 56 20' fill='none' stroke='white' stroke-opacity='.45' stroke-width='1.2'/>" +
    "<path d='M3 20 C6 3 34 1 62 20 C34 39 6 37 3 20 Z' fill='none' stroke='" + c1 + "' stroke-opacity='.4' stroke-width='1'/>" +
    '</svg>';
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function initLeafDrift() {
  const palette = [
    ['#fbe7a0', '#f0c75c'], ['#f6d070', '#e8a43e'], ['#f0b45c', '#dd8a3c'],
    ['#ec9858', '#d46a38'], ['#e07a48', '#bf4f2e'], ['#d9663f', '#a93f2a'], ['#e8c46a', '#b98a30']
  ];
  const count = window.innerWidth < 700 ? 11 : 22;

  const layer = document.createElement('div');
  layer.className = 'leaf-drift';
  layer.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < count; i++) {
    const [c0, c1] = palette[Math.floor(Math.random() * palette.length)];
    const leaf = document.createElement('i');
    leaf.style.backgroundImage = leafSprite(c0, c1);
    leaf.style.setProperty('--x', `${(Math.random() * 104 - 2).toFixed(1)}%`);
    leaf.style.setProperty('--s', `${(18 + Math.random() * 20).toFixed(0)}px`);
    leaf.style.setProperty('--dur', `${(16 + Math.random() * 14).toFixed(1)}s`);
    leaf.style.setProperty('--delay', `${(-Math.random() * 30).toFixed(1)}s`);
    leaf.style.setProperty('--dx', `${(-220 + Math.random() * 440).toFixed(0)}px`);
    leaf.style.setProperty('--rot', `${(Math.random() * 360).toFixed(0)}deg`);
    layer.append(leaf);
  }
  const stage = $('.grow-stage');
  if (!stage) return;
  stage.append(layer);
}

/** 카드: 마우스 위치에 따라 살짝 기운다 */
function initTilt() {
  const SELECTOR = '.acard, .skill-box, .ct-card, .proj-card';
  let current = null;

  const reset = () => {
    if (!current) return;
    current.classList.remove('is-tilting');
    current.style.removeProperty('--rx');
    current.style.removeProperty('--ry');
    current = null;
  };

  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      const card = event.target.closest?.(SELECTOR);

      if (card !== current) reset();
      if (!card) return;

      // 펼쳐진 상세 카드는 흔들리지 않게 둔다
      if (card.classList.contains('open')) return;

      const rect = card.getBoundingClientRect();
      const px = clamp((event.clientX - rect.left) / rect.width) - 0.5;
      const py = clamp((event.clientY - rect.top) / rect.height) - 0.5;

      card.classList.add('tilt-card', 'is-tilting');
      card.style.setProperty('--rx', `${(-py * 6).toFixed(2)}deg`);
      card.style.setProperty('--ry', `${(px * 8).toFixed(2)}deg`);
      current = card;
    },
    { passive: true }
  );

  document.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  $$(SELECTOR).forEach((card) => card.classList.add('tilt-card'));
}

export function initEffects() {
  initProgress();
  if (!motionOn()) return;

  initHero();
  initDrift();
  initLeafDrift();
  initTilt();
}
