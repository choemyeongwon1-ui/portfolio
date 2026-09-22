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

/** 설명을 빈 줄 기준으로 문단으로 나눈다. */
function toParagraphs(text) {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** 카드 위쪽에 보여줄 한 줄 요약 (설명의 첫 문단) */
function leadOf(project) {
  const [first] = toParagraphs(project.description);
  return first ?? '';
}

function projectCard(project, categoryLabel) {
  const meta = [];
  if (project.date) meta.push(project.date);
  if (project.role) meta.push(project.role);
  if (project.teamSize) meta.push(`참여 ${project.teamSize}명`);

  const detailChildren = toParagraphs(project.description)
    .slice(1)
    .map((paragraph) =>
      el('div', { className: 'detail-item', children: [el('span', { text: paragraph })] })
    );

  if (project.notes) {
    detailChildren.push(
      el('div', {
        className: 'detail-item',
        children: [el('strong', { text: '참고사항' }), el('span', { text: project.notes })]
      })
    );
  }

  const children = [
    el('div', {
      className: 'proj-card-top',
      children: [
        el('span', { className: 'proj-tag', text: categoryLabel ?? project.category }),
        el('h3', { text: project.title }),
        el('p', { text: leadOf(project) })
      ]
    }),
    el('div', {
      className: 'proj-meta',
      children: meta.map((value) => el('span', { text: value }))
    })
  ];

  // 펼칠 내용이 있을 때만 버튼을 단다.
  if (detailChildren.length) {
    children.push(
      el('button', {
        className: 'proj-toggle',
        text: '자세히 보기',
        attrs: { type: 'button', 'aria-expanded': 'false' }
      }),
      el('div', { className: 'proj-detail', children: detailChildren })
    );
  }

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

export function renderProjects({ items = [], total = 0 } = {}, categories = []) {
  const grid = $('#projGrid');
  const summary = $('#projSummary');
  const empty = $('#projEmpty');

  // 분야 id(web) → 표시 이름(웹)
  const labels = new Map(categories.map((category) => [category.id, category.label]));

  if (grid) render(grid, items.map((item) => projectCard(item, labels.get(item.category))));
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
