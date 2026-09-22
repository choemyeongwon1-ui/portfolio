// ==========================================
// 스크롤 등장 효과 · 스킬바 · 태그 기울임
// ------------------------------------------
// 화면 내용이 API 응답 뒤에 만들어지고, 필터를 바꾸면 카드가 다시 그려진다.
// 그래서 "한 번만 실행"이 아니라, 새로 생긴 요소에 다시 걸 수 있게 만들었다.
// ==========================================

import { $$ } from '../lib/dom.js';

const REVEAL_SELECTOR = [
  '.acard',
  '.skill-box',
  '.proj-card',
  '.ct-card',
  '.info-table',
  '.tag-cloud',
  '.msg-bubble',
  '.section-header',
  '.profile-card'
].join(', ');

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
  $$(REVEAL_SELECTOR, root).forEach((element) => {
    if (element.dataset.revealBound === 'true') return;
    element.dataset.revealBound = 'true';
    element.classList.add('reveal');
    revealObserver.observe(element);
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
