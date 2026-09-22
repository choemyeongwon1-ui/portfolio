// ==========================================
// 기술(스킬) 화면 그리기
// ------------------------------------------
// 스킬바의 width는 여기서 정하지 않는다.
// data-w 값만 심어두고, features/reveal.js가 화면에 보일 때 채운다.
// ==========================================

import { el, render, $ } from '../lib/dom.js';

function skillItem(item) {
  return el('div', {
    className: 'sk-item',
    children: [
      el('div', {
        className: 'sk-top',
        children: [el('span', { text: item.name }), el('span', { text: `${item.level}%` })]
      }),
      el('div', {
        className: 'sk-bar',
        children: [el('div', { className: 'sk-fill', attrs: { 'data-w': item.level } })]
      })
    ]
  });
}

function skillGroup(group) {
  return el('div', {
    className: 'skill-box',
    attrs: { id: group.id },
    children: [
      el('h3', {
        children: [el('span', { text: group.emoji }), document.createTextNode(` ${group.title}`)]
      }),
      el('div', {
        className: 'skill-list',
        children: (group.items ?? []).map(skillItem)
      })
    ]
  });
}

export function renderSkills(skills) {
  if (!skills) return;

  const grid = $('#skillsGrid');
  if (grid) render(grid, (skills.groups ?? []).map(skillGroup));

  const cloud = $('#tagCloud');
  if (cloud) {
    render(
      cloud,
      (skills.tags ?? []).map((tag) => el('span', { className: 'tag', text: tag }))
    );
  }
}
