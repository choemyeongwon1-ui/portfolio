// ==========================================
// 프로젝트 저장소 — JSON 파일 구현
// ------------------------------------------
// findAll({ category }) 처럼 조건을 인자로 받는다.
// 지금은 배열을 걸러내지만, DB 버전에서는 같은 자리에
// WHERE category = ? 같은 질의가 들어가면 된다.
// ==========================================

import { readJson } from './jsonStore.js';

export const projectsRepository = {
  /**
   * 조건에 맞는 프로젝트 목록을 반환한다.
   * @param {{ category?: string }} [filter]
   * @returns {Promise<object[]>}
   */
  async findAll(filter = {}) {
    const projects = await readJson('projects.json');
    const { category } = filter;

    if (!category || category === 'all') return projects;

    return projects.filter((project) => project.category === category);
  },

  /**
   * id로 프로젝트 하나를 찾는다. 없으면 null.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const projects = await readJson('projects.json');
    return projects.find((project) => project.id === id) ?? null;
  },

  /** 필터 탭에 쓸 분야 목록을 반환한다. */
  async findCategories() {
    return readJson('categories.json');
  }
};
