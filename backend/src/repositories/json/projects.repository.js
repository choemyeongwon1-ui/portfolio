// ==========================================
// 프로젝트 저장소 — JSON 파일 구현
// ------------------------------------------
// 읽기: findAll / findById / findCategories
// 쓰기: create / update / remove   ← 관리자 페이지가 사용한다
//
// findAll의 includeDrafts 옵션이 핵심이다.
//   방문자용 API  → includeDrafts: false  (공개된 것만)
//   관리자용 API  → includeDrafts: true   (초안까지 전부)
//
// DB 버전에서도 같은 함수 이름과 같은 반환 형태를 지키면
// 윗단 코드는 고치지 않아도 된다.
// ==========================================

import { readJson, writeJson } from './jsonStore.js';

const FILE = 'projects.json';

function sortByNewest(projects) {
  return [...projects].sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  );
}

export const projectsRepository = {
  /**
   * 조건에 맞는 프로젝트 목록을 반환한다.
   * @param {{ category?: string, includeDrafts?: boolean }} [filter]
   * @returns {Promise<object[]>}
   */
  async findAll(filter = {}) {
    const { category, includeDrafts = false } = filter;
    let projects = await readJson(FILE);

    if (!includeDrafts) {
      projects = projects.filter((project) => project.status === 'published');
    }

    if (category && category !== 'all') {
      projects = projects.filter((project) => project.category === category);
    }

    return sortByNewest(projects);
  },

  /**
   * id로 프로젝트 하나를 찾는다. 없으면 null.
   * @param {string} id
   * @param {{ includeDrafts?: boolean }} [options]
   */
  async findById(id, options = {}) {
    const { includeDrafts = false } = options;
    const projects = await readJson(FILE);
    const found = projects.find((project) => project.id === id) ?? null;

    if (!found) return null;
    if (!includeDrafts && found.status !== 'published') return null;

    return found;
  },

  /** 새 프로젝트를 추가한다. */
  async create(project) {
    const projects = await readJson(FILE);
    projects.push(project);
    await writeJson(FILE, projects);
    return project;
  },

  /** 기존 프로젝트를 통째로 바꾼다. 없으면 null. */
  async update(id, project) {
    const projects = await readJson(FILE);
    const index = projects.findIndex((item) => item.id === id);

    if (index === -1) return null;

    projects[index] = project;
    await writeJson(FILE, projects);
    return project;
  },

  /** 프로젝트를 지운다. 지웠으면 true. */
  async remove(id) {
    const projects = await readJson(FILE);
    const rest = projects.filter((project) => project.id !== id);

    if (rest.length === projects.length) return false;

    await writeJson(FILE, rest);
    return true;
  },

  /** 필터 탭에 쓸 분야 목록을 반환한다. */
  async findCategories() {
    return readJson('categories.json');
  }
};
