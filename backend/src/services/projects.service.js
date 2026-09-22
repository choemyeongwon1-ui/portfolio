// ==========================================
// 프로젝트 서비스
// ------------------------------------------
// 요청값 검증과 업무 규칙을 담당한다.
// (예: 없는 분야를 요청하면 오류, 목록에 개수를 함께 실어 보내기)
// ==========================================

import { projectsRepository } from '../repositories/index.js';
import { NotFoundError, BadRequestError } from '../lib/AppError.js';

export const projectsService = {
  /** 필터 탭 목록 */
  async getCategories() {
    return projectsRepository.findCategories();
  },

  /**
   * 분야별 프로젝트 목록.
   * @param {{ category?: string }} [options]
   */
  async getProjects({ category = 'all' } = {}) {
    const categories = await projectsRepository.findCategories();
    const isKnown = categories.some((item) => item.id === category);

    if (!isKnown) {
      throw new BadRequestError(`알 수 없는 분야입니다: ${category}`);
    }

    const items = await projectsRepository.findAll({ category });

    return {
      category,
      total: items.length,
      items
    };
  },

  /** id로 프로젝트 하나 */
  async getProjectById(id) {
    const project = await projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundError(`프로젝트를 찾을 수 없습니다: ${id}`);
    }

    return project;
  }
};
