// ==========================================
// 관리자 — 중복 안내
// ------------------------------------------
// 두 군데에서 알린다.
//   1) 제목을 쓰는 동안   : 같은 게 있으면 칸 아래에 살짝 알려준다
//   2) 저장을 눌렀을 때   : 서버가 409로 막으면 "통합 / 그래도 저장 / 취소"를 묻는다
//   3) 목록 위            : 이미 저장된 것들 중 겹치는 묶음을 보여준다
//
// 무엇을 지울지·합칠지는 사람이 정한다. 자동으로 지우지 않는다.
// ==========================================

import { el, render, $ } from '../lib/dom.js';
import { findDuplicate } from '../lib/duplicate.js';

/** 제목을 쓰는 동안 알려주는 짧은 안내 */
export function showTitleHint(values, projects, selectedId) {
  const slot = $('#dupHint');
  if (!slot) return;

  if (!values.title) {
    slot.hidden = true;
    return;
  }

  // 양식의 값은 linkUrl로 들어오므로, 비교 함수가 기대하는 모양으로 맞춘다.
  const candidate = {
    title: values.title,
    link: values.linkUrl ? { url: values.linkUrl } : null
  };

  const found = findDuplicate(candidate, projects, selectedId);

  if (!found) {
    slot.hidden = true;
    return;
  }

  const state = found.project.status === 'published' ? '공개 중' : '초안';
  slot.textContent = `이미 ${found.reason}이 같은 프로젝트가 있습니다 — "${
    found.project.title || '제목 없음'
  }" (${state})`;
  slot.hidden = false;
}

/**
 * 저장하려다 중복이 걸렸을 때 뜨는 선택 상자.
 * @param {object} duplicate 서버가 알려준 기존 프로젝트
 * @param {object} handlers { onMerge, onSaveAnyway, onCancel }
 */
export function showDuplicatePanel(duplicate, handlers) {
  const panel = $('#dupPanel');
  if (!panel) return;

  const state = duplicate.status === 'published' ? '공개 중' : '초안';
  const when = duplicate.date ? ` · ${duplicate.date}` : '';

  const mergeBtn = el('button', {
    className: 'btn btn-primary btn-sm',
    text: '기존 것에 합치기',
    attrs: { type: 'button' }
  });
  const anywayBtn = el('button', {
    className: 'btn btn-ghost btn-sm',
    text: '그래도 새로 저장',
    attrs: { type: 'button' }
  });
  const cancelBtn = el('button', {
    className: 'btn btn-ghost btn-sm',
    text: '취소',
    attrs: { type: 'button' }
  });

  mergeBtn.addEventListener('click', () => handlers.onMerge?.(duplicate));
  anywayBtn.addEventListener('click', () => handlers.onSaveAnyway?.());
  cancelBtn.addEventListener('click', () => hideDuplicatePanel());

  render(panel, [
    el('p', {
      className: 'dup-title',
      text: `${duplicate.matchedBy ?? '내용'}이 같은 프로젝트가 이미 있습니다`
    }),
    el('p', {
      className: 'dup-target',
      text: `"${duplicate.title || '제목 없음'}" (${state}${when})`
    }),
    el('p', {
      className: 'dup-help',
      text:
        '합치기를 고르면 기존 프로젝트를 불러와 지금 쓴 내용으로 채웁니다. ' +
        '기존에 이미 값이 있는 칸은 그대로 두므로, 확인한 뒤 저장하세요.'
    }),
    el('div', { className: 'dup-actions', children: [mergeBtn, anywayBtn, cancelBtn] })
  ]);

  panel.hidden = false;
}

export function hideDuplicatePanel() {
  const panel = $('#dupPanel');
  if (panel) panel.hidden = true;
}

/**
 * 이미 저장된 것들 중 겹치는 묶음을 목록 위에 보여준다.
 * @param {{reason: string, items: object[]}[]} groups
 * @param {object} handlers { onOpen, onDelete }
 */
export function renderDuplicateBanner(groups, handlers) {
  const banner = $('#dupBanner');
  if (!banner) return;

  if (!groups?.length) {
    banner.hidden = true;
    render(banner, []);
    return;
  }

  const blocks = groups.map((group) =>
    el('div', {
      className: 'dup-group',
      children: [
        el('p', {
          className: 'dup-group-head',
          text: `${group.reason}이 같은 프로젝트 ${group.items.length}개`
        }),
        ...group.items.map((item) => {
          const openBtn = el('button', {
            className: 'btn btn-ghost btn-sm',
            text: '열기',
            attrs: { type: 'button' }
          });
          const delBtn = el('button', {
            className: 'btn btn-danger btn-sm',
            text: '삭제',
            attrs: { type: 'button' }
          });

          openBtn.addEventListener('click', () => handlers.onOpen?.(item.id));
          delBtn.addEventListener('click', () => handlers.onDelete?.(item.id));

          return el('div', {
            className: 'dup-row',
            children: [
              el('span', {
                className: 'dup-row-title',
                text: item.title || '(제목 없음)'
              }),
              el('span', {
                className: item.status === 'published' ? 'badge badge-published' : 'badge badge-draft',
                text: item.status === 'published' ? '공개' : '초안'
              }),
              el('span', { className: 'dup-row-actions', children: [openBtn, delBtn] })
            ]
          });
        })
      ]
    })
  );

  render(banner, [
    el('p', { className: 'dup-banner-head', text: '중복으로 보이는 프로젝트가 있습니다' }),
    ...blocks,
    el('p', {
      className: 'dup-help',
      text: '하나를 열어 내용을 합친 뒤, 남는 쪽을 삭제하면 정리됩니다.'
    })
  ]);

  banner.hidden = false;
}

/**
 * 기존 프로젝트에 지금 쓴 값을 채워 넣는다.
 * 기존에 값이 있는 칸은 건드리지 않는다 — 덮어써서 잃는 일이 없도록.
 */
export function mergeInto(existing, values) {
  const pick = (a, b) => (a !== '' && a !== null && a !== undefined ? a : b);

  return {
    ...existing,
    title: pick(existing.title, values.title),
    category: pick(existing.category, values.category),
    date: pick(existing.date, values.date),
    role: pick(existing.role, values.role),
    teamSize: pick(existing.teamSize, values.teamSize),
    description: pick(existing.description, values.description),
    notes: pick(existing.notes, values.notes),
    link: existing.link?.url
      ? existing.link
      : values.linkUrl
        ? { url: values.linkUrl, label: values.linkLabel || '바로가기' }
        : null
  };
}
