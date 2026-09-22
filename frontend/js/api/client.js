// ==========================================
// API 호출 공통 도구
// ------------------------------------------
// 주소 조립, 시간 초과, 오류 형태를 여기서 한 번에 처리한다.
// 화면 코드에서는 fetch를 직접 쓰지 않는다.
// ==========================================

import { config } from '../config.js';

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function buildUrl(pathname, query) {
  const url = new URL(
    config.apiBaseUrl + pathname,
    // apiBaseUrl이 '/api' 같은 상대 경로여도 동작하도록 기준 주소를 준다.
    window.location.origin
  );

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

/**
 * API에 GET 요청을 보내고 data 부분만 돌려준다.
 * @param {string} pathname  예: '/projects'
 * @param {object} [query]   예: { category: 'web' }
 */
export async function apiGet(pathname, query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeout);

  try {
    const response = await fetch(buildUrl(pathname, query), {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(payload?.error?.message ?? `요청이 실패했습니다 (${response.status})`, {
        status: response.status,
        code: payload?.error?.code
      });
    }

    return payload?.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error.name === 'AbortError') {
      throw new ApiError('서버 응답이 너무 늦습니다. 잠시 후 다시 시도해 주세요.', {
        code: 'TIMEOUT'
      });
    }

    throw new ApiError('서버에 연결하지 못했습니다. 백엔드가 실행 중인지 확인해 주세요.', {
      code: 'NETWORK_ERROR'
    });
  } finally {
    clearTimeout(timer);
  }
}
