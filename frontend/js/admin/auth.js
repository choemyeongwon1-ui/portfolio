// ==========================================
// 관리자 로그인 화면
// ------------------------------------------
// 비밀번호는 여기서 서버로 보내기만 하고, 어디에도 저장하지 않는다.
// 저장되는 것은 서버가 돌려준 토큰뿐이다.
// ==========================================

import { adminApi, adminToken } from '../api/admin.api.js';
import { $ } from '../lib/dom.js';

function showLoginError(message) {
  const box = $('#loginError');
  if (!box) return;

  box.textContent = message;
  box.hidden = !message;
}

/**
 * 로그인 화면을 준비한다.
 * @param {() => void} onSuccess 로그인에 성공했을 때 부를 함수
 */
export function initAuth(onSuccess) {
  const form = $('#loginForm');
  const input = $('#loginPassword');
  const submit = $('#loginSubmit');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showLoginError('');

    const password = input.value;

    if (!password) {
      showLoginError('비밀번호를 입력해 주세요.');
      input.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = '확인 중…';

    try {
      await adminApi.login(password);
      // 화면에 남지 않도록 지운다.
      input.value = '';
      onSuccess();
    } catch (error) {
      showLoginError(error.message);
      input.select();
    } finally {
      submit.disabled = false;
      submit.textContent = '로그인';
    }
  });
}

/** 이미 로그인된 상태인지 확인한다. */
export async function hasValidSession() {
  if (!adminToken.get()) return false;

  try {
    await adminApi.checkSession();
    return true;
  } catch {
    adminToken.clear();
    return false;
  }
}

export function showLogin() {
  $('#loginScreen').hidden = false;
  $('#adminScreen').hidden = true;
  $('#loginPassword')?.focus();
}

export function showAdmin() {
  $('#loginScreen').hidden = true;
  $('#adminScreen').hidden = false;
}
