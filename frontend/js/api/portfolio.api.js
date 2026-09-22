// ==========================================
// 포트폴리오 API 모음
// ------------------------------------------
// 백엔드의 엔드포인트 하나당 함수 하나.
// 주소가 바뀌면 이 파일만 고치면 된다.
// ==========================================

import { apiGet } from './client.js';

export const portfolioApi = {
  /** 이름, 소개, 연락처 등 기본 정보 */
  getProfile() {
    return apiGet('/profile');
  },

  /** 기술 그룹과 관심 키워드 */
  getSkills() {
    return apiGet('/skills');
  },

  /** 필터 탭 목록 */
  getCategories() {
    return apiGet('/categories');
  },

  /**
   * 프로젝트 목록
   * @param {string} [category] 'all' | 'web' | 'data' | 'design'
   * @returns {Promise<{category: string, total: number, items: object[]}>}
   */
  getProjects(category = 'all') {
    return apiGet('/projects', { category });
  },

  /** 프로젝트 하나 */
  getProject(id) {
    return apiGet(`/projects/${encodeURIComponent(id)}`);
  },

  /** 서버 상태 확인 */
  getHealth() {
    return apiGet('/health');
  }
};
