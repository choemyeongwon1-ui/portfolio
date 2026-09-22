// ==========================================
// 프로젝트 화면 그리기
// ------------------------------------------
// 필터 탭과 프로젝트 카드를 데이터로부터 만든다.
// 카드 구조는 기존 style.css가 기대하는 모양을 그대로 지킨다.
// ==========================================

import { el, render, $ } from '../lib/dom.js';

export function renderCategories(categories, activeId = 'all') {
  const bar = $('#filterBar');
  if (!bar) return;

  render(
    bar,
    (categories ?? []).map((category) =>
      el('button', {
        className: category.id === activeId ? 'filter-btn is-active' : 'filter-btn',
        text: category.label,
        dataset: { filter: category.id },
        attrs: {
          type: 'button',
          title: category.description ?? '',
          'aria-pressed': String(category.id === activeId)
        }
      })
    )
  );
}

function projectCard(project) {
  const children = [
    el('div', {
      className: 'proj-card-top',
      children: [
        el('span', { className: 'proj-tag', text: project.categoryLabel ?? project.category }),
        el('h3', { text: project.title }),
        el('p', { text: project.summary })
      ]
    }),
    el('div', {
      className: 'proj-meta',
      children: (project.keywords ?? []).map((keyword) => el('span', { text: keyword }))
    }),
    el('button', {
      className: 'proj-toggle',
      text: '자세히 보기',
      attrs: { type: 'button', 'aria-expanded': 'false' }
    }),
    el('div', {
      className: 'proj-detail',
      children: (project.details ?? []).map((detail) =>
        el('div', {
          className: 'detail-item',
          children: [el('strong', { text: detail.label }), el('span', { text: detail.body })]
        })
      )
    })
  ];

  if (project.link?.url) {
    children.push(
      el('a', {
        className: 'proj-link',
        text: project.link.label ?? '바로가기',
        attrs: {
          href: project.link.url,
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      })
    );
  }

  return el('article', {
    className: 'proj-card',
    dataset: { category: project.category, title: project.title, id: project.id },
    children
  });
}

export function renderProjects({ items = [], total = 0 } = {}) {
  const grid = $('#projGrid');
  const summary = $('#projSummary');
  const empty = $('#projEmpty');

  if (grid) render(grid, items.map(projectCard));
  if (summary) summary.textContent = `프로젝트 ${total}개`;
  if (empty) empty.hidden = total > 0;
}

/** 목록을 불러오는 동안 보여줄 안내 */
export function renderProjectsLoading() {
  const summary = $('#projSummary');
  if (summary) summary.textContent = '불러오는 중…';
}

/** 목록을 불러오지 못했을 때 */
export function renderProjectsError(message) {
  const grid = $('#projGrid');
  const summary = $('#projSummary');
  const empty = $('#projEmpty');

  if (grid) render(grid, []);
  if (summary) summary.textContent = '불러오지 못했습니다';
  if (empty) {
    empty.textContent = message;
    empty.hidden = false;
  }
}
