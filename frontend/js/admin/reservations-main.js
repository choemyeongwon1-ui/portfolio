// ==========================================
// 예약 관리 페이지 진입점
// ------------------------------------------
// 로그인 → 목록 불러오기 → 상태 버튼 클릭 시 갱신, 순서로 묶는다.
// 로그인 화면(auth.js)은 admin.html과 같은 요소 id를 쓰므로 그대로 재사용한다.
// ==========================================

import { adminApi, purgeStoredTokens } from '../api/admin.api.js';
import { $ } from '../lib/dom.js';
import { showToast } from '../lib/toast.js';

import { initAuth, showLogin, showAdmin } from './auth.js';
import { renderReservations } from './reservations-list.js';

function handleAuthError(error) {
  if (error?.status === 401) {
    showLogin();
    showToast('로그인이 만료되었습니다. 다시 로그인해 주세요.');
    return true;
  }
  return false;
}

async function loadReservations() {
  try {
    const items = await adminApi.listReservations();
    renderReservations(items ?? [], handleChangeStatus);
  } catch (error) {
    if (handleAuthError(error)) return;
    showToast(error.message);
  }
}

async function handleChangeStatus(id, status) {
  try {
    await adminApi.updateReservationStatus(id, status);
    showToast(`상태를 "${status}"(으)로 바꿨습니다`);
    await loadReservations();
  } catch (error) {
    if (handleAuthError(error)) return;
    showToast(error.message);
  }
}

async function enterAdmin() {
  showAdmin();
  await loadReservations();
}

function bindExitCleanup() {
  window.addEventListener('pagehide', () => {
    adminApi.logoutOnExit();
    purgeStoredTokens();

    const input = $('#loginPassword');
    if (input) input.value = '';
  });
}

function start() {
  purgeStoredTokens();

  $('#logoutBtn')?.addEventListener('click', async () => {
    await adminApi.logout();
    showLogin();
    showToast('로그아웃되었습니다');
  });

  bindExitCleanup();
  initAuth(enterAdmin);

  // 토큰은 메모리에만 있으므로, 이 페이지를 연 시점에는 항상 비어 있다.
  showLogin();
}

document.addEventListener('DOMContentLoaded', start);
