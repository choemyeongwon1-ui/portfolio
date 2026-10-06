// ==========================================
// 예약 관리 페이지 진입점
// ------------------------------------------
// 로그인 → 목록 불러오기 → 요약·필터·테이블 그리기 → 상태 버튼으로 갱신, 순서로 묶는다.
// 로그인 화면(auth.js)은 admin.html과 같은 요소 id를 쓰므로 그대로 재사용한다.
// ==========================================

import { adminApi, purgeStoredTokens } from '../api/admin.api.js';
import { $ } from '../lib/dom.js';
import { showToast } from '../lib/toast.js';

import { initAuth, showLogin, showAdmin } from './auth.js';
import { renderSummary, renderFilterButtons, renderReservations } from './reservations-list.js';

const state = {
  all: [], // 서버에서 받은 전체 목록
  filter: 'all' // 'all' 또는 RESERVATION_STATUSES 중 하나
};

function handleAuthError(error) {
  if (error?.status === 401) {
    showLogin();
    showToast('로그인이 만료되었습니다. 다시 로그인해 주세요.');
    return true;
  }
  return false;
}

/** 현재 상태(state)를 기준으로 요약·필터 탭·테이블을 다시 그린다 (네트워크 호출 없음). */
function renderAll() {
  renderSummary(state.all);
  renderFilterButtons(state.filter, state.all, handleFilterSelect);

  const filtered = state.filter === 'all' ? state.all : state.all.filter((r) => r.status === state.filter);
  renderReservations(filtered, handleChangeStatus, state.filter);
}

function handleFilterSelect(filter) {
  state.filter = filter;
  renderAll();
}

async function loadReservations() {
  try {
    state.all = (await adminApi.listReservations()) ?? [];
    renderAll();
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
