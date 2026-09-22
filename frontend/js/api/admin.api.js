// ==========================================
// 관리자 API 호출
// ------------------------------------------
// 비밀번호는 로그인할 때 딱 한 번만 보낸다.
// 그 뒤로는 서버가 준 토큰만 들고 다닌다.
// 토큰은 sessionStorage에 두기 때문에 탭을 닫으면 사라진다.
// ==========================================

import { config } from '../config.js';
import { ApiError } from './client.js';

const TOKEN_KEY = 'portfolio.admin.token';

export const adminToken = {
  get() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) ?? '';
    } catch {
      return '';
    }
  },
  set(token) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* 브라우저가 저장을 막아도 이번 세션 동안은 동작한다 */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* 무시 */
    }
  }
};

async function request(method, pathname, body) {
  const url = new URL(config.apiBaseUrl + pathname, window.location.origin);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeout);

  const headers = { Accept: 'application/json' };
  const token = adminToken.get();

  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new ApiError(
        payload?.error?.message ?? `요청이 실패했습니다 (${response.status})`,
        { status: response.status, code: payload?.error?.code }
      );
      // 어느 칸이 잘못됐는지 서버가 알려주면 함께 전달한다.
      error.details = payload?.error?.details ?? [];
      // 중복이면 상대 프로젝트도 함께 전달한다 (통합 여부를 묻기 위해).
      error.duplicate = payload?.error?.duplicate ?? null;
      throw error;
    }

    return payload?.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error.name === 'AbortError') {
      throw new ApiError('서버 응답이 너무 늦습니다.', { code: 'TIMEOUT' });
    }

    throw new ApiError('서버에 연결하지 못했습니다.', { code: 'NETWORK_ERROR' });
  } finally {
    clearTimeout(timer);
  }
}

export const adminApi = {
  /** 로그인. 성공하면 토큰을 저장한다. */
  async login(password) {
    const result = await request('POST', '/admin/login', { password });
    adminToken.set(result.token);
    return result;
  },

  async logout() {
    try {
      await request('POST', '/admin/logout');
    } finally {
      adminToken.clear();
    }
  },

  /** 저장된 토큰이 아직 쓸 수 있는지 확인 */
  checkSession() {
    return request('GET', '/admin/session');
  },

  /** 초안까지 포함한 전체 목록 */
  listProjects() {
    return request('GET', '/admin/projects');
  },

  /** 이미 저장된 것들 중 겹치는 묶음 */
  getDuplicates() {
    return request('GET', '/admin/duplicates');
  },

  createProject(project) {
    return request('POST', '/admin/projects', project);
  },

  updateProject(id, project) {
    return request('PUT', `/admin/projects/${encodeURIComponent(id)}`, project);
  },

  deleteProject(id) {
    return request('DELETE', `/admin/projects/${encodeURIComponent(id)}`);
  },

  /** 분야 목록은 공개 API를 그대로 쓴다 */
  getCategories() {
    return request('GET', '/categories');
  }
};
