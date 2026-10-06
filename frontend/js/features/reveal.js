// ==========================================
// 스크롤 등장 효과 · 스킬바 · 태그 기울임
// ------------------------------------------
// 화면 내용이 API 응답 뒤에 만들어지고, 필터를 바꾸면 카드가 다시 그려진다.
// 그래서 "한 번만 실행"이 아니라, 새로 생긴 요소에 다시 걸 수 있게 만들었다.
// ==========================================

import { $$ } from '../lib/dom.js';

// 요소 종류별로 어느 방향에서 날아올지 정한다.
// 'alternate'는 같은 종류 안에서 왼쪽·오른쪽을 번갈아 써서 지그재그로 등장시킨다.
const REVEAL_VARIANTS = {
  '.proj-card': 'alternate',
  '.skill-box': 'reveal-left',
  '.acard': 'reveal-right',
  '.ct-card': 'reveal-scale',
  '.info-table': 'reveal-up',
  '.tag-cloud': 'reveal-scale',
  '.msg-bubble': 'reveal-right',
  '.section-header': 'reveal-up',
  '.profile-card': 'reveal-scale'
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('visible'), index * 70);
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
);

const skillObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.querySelectorAll('.sk-fill').forEach((fill, index) => {
        const width = fill.getAttribute('data-w');
        setTimeout(() => {
          fill.style.width = `${width}%`;
        }, index * 120);
      });

      skillObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.3 }
);

/** 새로 그려진 영역에 등장 효과를 건다. 여러 번 불러도 안전하다. */
export function observeReveal(root = document) {
  Object.entries(REVEAL_VARIANTS).forEach(([selector, variant]) => {
    $$(selector, root).forEach((element, index) => {
      if (element.dataset.revealBound === 'true') return;
      element.dataset.revealBound = 'true';

      const directionClass = variant === 'alternate'
        ? (index % 2 === 0 ? 'reveal-left' : 'reveal-right')
        : variant;

      element.classList.add('reveal', directionClass);
      revealObserver.observe(element);
    });
  });

  $$('.skill-box', root).forEach((box) => {
    if (box.dataset.skillBound === 'true') return;
    box.dataset.skillBound = 'true';
    skillObserver.observe(box);
  });
}

/** 태그에 마우스를 올리면 살짝 기울어진다. */
export function bindTagHover(root = document) {
  $$('.tag', root).forEach((tag) => {
    if (tag.dataset.hoverBound === 'true') return;
    tag.dataset.hoverBound = 'true';

    tag.addEventListener('mouseenter', () => {
      const degree = (Math.random() - 0.5) * 6;
      tag.style.transform = `translateY(-2px) rotate(${degree}deg)`;
    });

    tag.addEventListener('mouseleave', () => {
      tag.style.transform = '';
    });
  });
}

/**
 * 히어로 글·프로필 카드가 양옆에서 날아 들어온다.
 * 스크롤을 기다리지 않고, 내용(renderProfile)이 채워진 직후 한 번만 호출한다 —
 * 빈 상태로 먼저 날아들었다가 글자가 뒤늦게 팝인하는 것을 막기 위해서다.
 */
export function initHeroEntrance() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('hero-in');
    });
  });
}

/** 페이지 로드 시 부드럽게 나타나기 */
export function initPageFade() {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  });
}
