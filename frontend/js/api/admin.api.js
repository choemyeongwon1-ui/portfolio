// ==========================================
// 관리자 API 호출
// ------------------------------------------
// 비밀번호는 로그인할 때 딱 한 번만 보내고, 어디에도 남기지 않는다.
// 그 뒤로는 서버가 준 토큰만 들고 다닌다.
//
// ★ 토큰은 이 변수(메모리)에만 있다. 브라우저 저장소를 쓰지 않는다.
//   - 창이나 탭을 닫으면       → 사라짐
//   - 새로고침(F5)해도         → 사라짐
//   - 새 창·새 탭에서 열어도   → 없음
//   - 브라우저가 탭을 복원해도 → 없음
//   따라서 관리자 페이지에 들어올 때마다 비밀번호를 새로 입력하게 된다.
//
//   sessionStorage에 두면 새로고침과 탭 복원에서 살아남는다.
//   그 편이 편리하지만, 매번 권한을 다시 확인받는 쪽을 택했다.
// ==========================================

import { config } from '../config.js';
import { ApiError } from './client.js';

const STORAGE_KEY = 'portfolio.admin.token';

// 페이지가 살아 있는 동안에만 존재하는 토큰
let token = '';

export const adminToken = {
  get() {
    return token;
  },
  set(value) {
    token = value ?? '';
  },
  clear() {
    token = '';
  }
};

/**
 * 예전 버전이 sessionStorage/localStorage에 남겨둔 토큰을 지운다.
 * 이미 브라우저에 저장된 것이 있으면 계속 남아 있기 때문에, 시작할 때 한 번 치운다.
 */
export function purgeStoredTokens() {
  for (const store of [globalThis.sessionStorage, globalThis.localStorage]) {
    try {
      store?.removeItem(STORAGE_KEY);
    } catch {
      /* 브라우저가 저장소를 막아둔 경우 — 지울 것도 없으므로 넘어간다 */
    }
  }
}

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

  /**
   * 창을 닫거나 다른 페이지로 떠날 때 서버 세션도 끊는다.
   * 떠나는 중이라 보통의 요청은 취소되므로 keepalive로 보낸다.
   * 실패해도 상관없다 — 토큰은 어차피 메모리와 함께 사라진다.
   */
  logoutOnExit() {
    const current = adminToken.get();
    if (!current) return;

    adminToken.clear();

    try {
      fetch(new URL(`${config.apiBaseUrl}/admin/logout`, window.location.origin), {
        method: 'POST',
        headers: { Authorization: `Bearer ${current}` },
        keepalive: true
      }).catch(() => {});
    } catch {
      /* 떠나는 중이므로 실패해도 무시한다 */
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
