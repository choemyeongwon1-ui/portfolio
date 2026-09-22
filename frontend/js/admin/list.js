// ==========================================
// 관리자 — 왼쪽 프로젝트 목록
// ------------------------------------------
// 초안까지 전부 보여준다. 공개된 것과 초안을 뱃지로 구분한다.
// ==========================================

import { el, render, $ } from '../lib/dom.js';

/**
 * 목록을 그린다.
 * @param {object[]} projects
 * @param {object[]} categories
 * @param {string} selectedId 지금 고른 프로젝트
 * @param {(id: string) => void} onSelect
 */
export function renderList(projects, categories, selectedId, onSelect) {
  const list = $('#projectList');
  const count = $('#listCount');
  if (!list) return;

  const labels = new Map(categories.map((category) => [category.id, category.label]));
  const published = projects.filter((project) => project.status === 'published').length;
  const drafts = projects.length - published;

  if (count) {
    count.textContent = projects.length
      ? `공개 ${published}개 · 초안 ${drafts}개`
      : '아직 프로젝트가 없습니다';
  }

  if (!projects.length) {
    render(list, [
      el('li', {
        className: 'list-empty',
        text: '오른쪽에서 내용을 채우고 저장해 보세요.'
      })
    ]);
    return;
  }

  render(
    list,
    projects.map((project) => {
      const isPublished = project.status === 'published';
      const hasTitle = Boolean(project.title);

      const badges = [
        el('span', {
          className: isPublished ? 'badge badge-published' : 'badge badge-draft',
          text: isPublished ? '공개' : '초안'
        })
      ];

      if (project.category) {
        badges.push(
          el('span', {
            className: 'badge badge-category',
            text: labels.get(project.category) ?? project.category
          })
        );
      }

      const button = el('button', {
        className:
          project.id === selectedId ? 'project-item is-active' : 'project-item',
        attrs: { type: 'button' },
        children: [
          el('span', {
            className: hasTitle ? 'project-item-title' : 'project-item-title is-empty',
            text: hasTitle ? project.title : '(제목 없음)'
          }),
          el('span', { className: 'project-item-meta', children: badges })
        ]
      });

      button.addEventListener('click', () => onSelect(project.id));

      return el('li', { children: [button] });
    })
  );
}
