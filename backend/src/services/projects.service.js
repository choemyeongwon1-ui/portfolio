// ==========================================
// 프로젝트 서비스
// ------------------------------------------
// 요청값 검증과 업무 규칙을 담당한다.
//
// 이 파일의 핵심 규칙 (관리자 페이지 요구사항)
//   초안(draft)     : 빈칸이 있어도 저장된다. 방문자에게는 보이지 않는다.
//   공개(published) : 참고사항·링크를 뺀 모든 칸이 채워져야 저장된다.
//
// 검증은 화면에서도 하지만, 여기서 한 번 더 한다.
// 화면 검사는 우회할 수 있지만 서버 검사는 우회할 수 없기 때문이다.
// ==========================================

import crypto from 'node:crypto';

import { projectsRepository } from '../repositories/index.js';
import { NotFoundError, BadRequestError } from '../lib/AppError.js';
import { withJosa } from '../lib/josa.js';

export const PROJECT_STATUS = { DRAFT: 'draft', PUBLISHED: 'published' };

// 공개하려면 반드시 채워야 하는 칸
const REQUIRED_FOR_PUBLISH = [
  { key: 'title', label: '제목' },
  { key: 'category', label: '분야' },
  { key: 'role', label: '역할' },
  { key: 'description', label: '설명' },
  { key: 'date', label: '날짜' },
  { key: 'teamSize', label: '참여인원 수' }
];

function trim(value) {
  return typeof value === 'string' ? value.trim() : value ?? '';
}

/** 제목을 주소에 쓸 수 있는 id로 바꾼다. */
function toSlug(title) {
  const base = String(title ?? '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  const suffix = crypto.randomBytes(3).toString('hex');
  return base ? `${base}-${suffix}` : `project-${suffix}`;
}

/** 화면에서 온 값을 저장할 형태로 다듬는다. */
function normalize(input) {
  const status =
    input.status === PROJECT_STATUS.PUBLISHED ? PROJECT_STATUS.PUBLISHED : PROJECT_STATUS.DRAFT;

  const teamSizeRaw = trim(input.teamSize);
  const teamSize =
    teamSizeRaw === '' || teamSizeRaw === null ? '' : Number.parseInt(teamSizeRaw, 10);

  const linkUrl = trim(input.linkUrl ?? input.link?.url);
  const linkLabel = trim(input.linkLabel ?? input.link?.label);

  return {
    status,
    category: trim(input.category),
    title: trim(input.title),
    role: trim(input.role),
    description: trim(input.description),
    date: trim(input.date),
    teamSize: Number.isNaN(teamSize) ? '' : teamSize,
    notes: trim(input.notes),
    link: linkUrl ? { url: linkUrl, label: linkLabel || '바로가기' } : null
  };
}

/**
 * 저장해도 되는 값인지 확인한다.
 * @returns {{field: string, message: string}[]} 문제가 없으면 빈 배열
 */
function validate(project, categories) {
  const errors = [];

  // 분야는 값이 있을 때 항상 확인한다 (초안이어도 엉뚱한 값은 막는다)
  if (project.category) {
    const known = categories.some(
      (item) => item.id === project.category && item.id !== 'all'
    );
    if (!known) {
      errors.push({ field: 'category', message: '알 수 없는 분야입니다.' });
    }
  }

  if (project.teamSize !== '' && (!Number.isInteger(project.teamSize) || project.teamSize < 1)) {
    errors.push({ field: 'teamSize', message: '참여인원 수는 1 이상의 숫자여야 합니다.' });
  }

  if (project.link?.url && !/^https?:\/\//i.test(project.link.url)) {
    errors.push({ field: 'linkUrl', message: '링크는 http:// 또는 https:// 로 시작해야 합니다.' });
  }

  // 초안은 여기까지만 확인한다. 빈칸이 있어도 저장할 수 있다.
  if (project.status !== PROJECT_STATUS.PUBLISHED) return errors;

  for (const { key, label } of REQUIRED_FOR_PUBLISH) {
    const value = project[key];
    const empty = value === '' || value === null || value === undefined;

    if (empty) {
      errors.push({ field: key, message: `공개하려면 ${withJosa(label)} 입력해야 합니다.` });
    }
  }

  return errors;
}

export const projectsService = {
  /** 필터 탭 목록 */
  async getCategories() {
    return projectsRepository.findCategories();
  },

  /**
   * 분야별 프로젝트 목록.
   * @param {{ category?: string, includeDrafts?: boolean }} [options]
   */
  async getProjects({ category = 'all', includeDrafts = false } = {}) {
    const categories = await projectsRepository.findCategories();
    const isKnown = categories.some((item) => item.id === category);

    if (!isKnown) {
      throw new BadRequestError(`알 수 없는 분야입니다: ${category}`);
    }

    const items = await projectsRepository.findAll({ category, includeDrafts });

    return { category, total: items.length, items };
  },

  /** id로 프로젝트 하나 */
  async getProjectById(id, { includeDrafts = false } = {}) {
    const project = await projectsRepository.findById(id, { includeDrafts });

    if (!project) {
      throw new NotFoundError(`프로젝트를 찾을 수 없습니다: ${id}`);
    }

    return project;
  },

  /** 새 프로젝트 저장 (관리자) */
  async createProject(input) {
    const categories = await projectsRepository.findCategories();
    const project = normalize(input);
    const errors = validate(project, categories);

    if (errors.length) {
      throw new BadRequestError(errors[0].message, errors);
    }

    const now = new Date().toISOString();

    return projectsRepository.create({
      id: toSlug(project.title),
      ...project,
      createdAt: now,
      updatedAt: now
    });
  },

  /** 기존 프로젝트 수정 (관리자) */
  async updateProject(id, input) {
    const existing = await projectsRepository.findById(id, { includeDrafts: true });

    if (!existing) {
      throw new NotFoundError(`프로젝트를 찾을 수 없습니다: ${id}`);
    }

    const categories = await projectsRepository.findCategories();
    const project = normalize(input);
    const errors = validate(project, categories);

    if (errors.length) {
      throw new BadRequestError(errors[0].message, errors);
    }

    return projectsRepository.update(id, {
      ...existing,
      ...project,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    });
  },

  /** 프로젝트 삭제 (관리자) */
  async deleteProject(id) {
    const removed = await projectsRepository.remove(id);

    if (!removed) {
      throw new NotFoundError(`프로젝트를 찾을 수 없습니다: ${id}`);
    }

    return { id };
  }
};
