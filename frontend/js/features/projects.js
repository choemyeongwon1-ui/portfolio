// ==========================================
// 프로젝트 — 분야 필터 + 상세 보기 토글
// ------------------------------------------
// 예전에는 모든 카드를 HTML에 넣어 두고 CSS로 숨겼지만,
// 이제는 필터를 누를 때마다 백엔드에 해당 분야만 요청한다.
//   GET /api/projects?category=web
// 나중에 프로젝트가 수백 개가 되어도 같은 구조가 그대로 통한다.
// ==========================================

import { portfolioApi } from '../api/portfolio.api.js';
import { store, setState } from '../store.js';
import { $, $$ } from '../lib/dom.js';
import {
  renderCategories,
  renderProjects,
  renderProjectsLoading,
  renderProjectsError
} from '../render/projects.render.js';
import { observeReveal } from './reveal.js';

/** 카드 안의 "자세히 보기" 버튼 (카드가 다시 그려질 때마다 호출) */
function bindDetailToggles() {
  $$('.proj-toggle').forEach((button) => {
    if (button.dataset.toggleBound === 'true') return;
    button.dataset.toggleBound = 'true';

    button.addEventListener('click', () => {
      const card = button.closest('.proj-card');
      const isOpen = card.classList.toggle('open');
      button.setAttribute('aria-expanded', String(isOpen));
      button.textContent = isOpen ? '접기' : '자세히 보기';
    });
  });
}

async function loadProjects(category) {
  renderProjectsLoading();

  try {
    const result = await portfolioApi.getProjects(category);

    setState({ currentCategory: category });
    renderProjects(result);
    bindDetailToggles();
    observeReveal($('#projGrid') ?? document);
  } catch (error) {
    renderProjectsError(error.message);
  }
}

function bindFilterButtons() {
  const bar = $('#filterBar');
  if (!bar || bar.dataset.filterBound === 'true') return;
  bar.dataset.filterBound = 'true';

  // 버튼이 다시 그려져도 동작하도록 부모에 한 번만 건다 (이벤트 위임)
  bar.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-btn');
    if (!button) return;

    $$('.filter-btn', bar).forEach((btn) => {
      const isActive = btn === button;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    loadProjects(button.dataset.filter);
  });
}

export async function initProjects() {
  renderCategories(store.categories, store.currentCategory);
  bindFilterButtons();
  await loadProjects(store.currentCategory);
}
