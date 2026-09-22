// ==========================================
// 관리자 페이지 진입점
// ------------------------------------------
// 로그인 → 목록 불러오기 → 선택/저장/삭제 순서로 묶는다.
// ==========================================

import { adminApi, adminToken } from '../api/admin.api.js';
import { $ } from '../lib/dom.js';
import { showToast } from '../lib/toast.js';

import { initAuth, hasValidSession, showLogin, showAdmin } from './auth.js';
import { renderList } from './list.js';
import {
  fillCategories,
  fillForm,
  readForm,
  validateForm,
  showFieldErrors,
  clearErrors,
  showFormMessage,
  hideFormMessage
} from './form.js';

const state = {
  projects: [],
  categories: [],
  selectedId: null
};

/** 지금 고른 프로젝트를 양식에 표시한다. */
function selectProject(id) {
  state.selectedId = id;

  const project = state.projects.find((item) => item.id === id) ?? null;
  fillForm(project);
  renderList(state.projects, state.categories, state.selectedId, selectProject);
}

function startNewProject() {
  state.selectedId = null;
  fillForm(null);
  renderList(state.projects, state.categories, null, selectProject);
  $('#fTitle')?.focus();
}

async function loadProjects() {
  const result = await adminApi.listProjects();
  state.projects = result?.items ?? [];
  renderList(state.projects, state.categories, state.selectedId, selectProject);
}

/** 로그인이 풀렸을 때 로그인 화면으로 되돌린다. */
function handleAuthError(error) {
  if (error?.status === 401) {
    adminToken.clear();
    showLogin();
    showToast('로그인이 만료되었습니다. 다시 로그인해 주세요.');
    return true;
  }
  return false;
}

async function handleSave(event) {
  event.preventDefault();

  const saveBtn = $('#saveBtn');
  const values = readForm();

  clearErrors();
  hideFormMessage();

  // 화면에서 먼저 확인한다 (서버도 같은 규칙으로 다시 확인한다)
  const errors = validateForm(values);
  if (errors.length) {
    showFieldErrors(errors);
    showFormMessage(`입력하지 않은 칸이 ${errors.length}개 있습니다.`, 'error');
    return;
  }

  const label = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = '저장 중…';

  try {
    const saved = state.selectedId
      ? await adminApi.updateProject(state.selectedId, values)
      : await adminApi.createProject(values);

    state.selectedId = saved.id;
    await loadProjects();
    fillForm(saved);
    renderList(state.projects, state.categories, state.selectedId, selectProject);

    showFormMessage(
      saved.status === 'published'
        ? '저장했습니다. 사이트에 공개되었습니다.'
        : '초안으로 저장했습니다. 사이트에는 보이지 않습니다.',
      'success'
    );
    showToast('저장되었습니다');
  } catch (error) {
    if (handleAuthError(error)) return;

    // 서버가 어느 칸이 문제인지 알려주면 그대로 표시한다.
    if (error.details?.length) {
      showFieldErrors(error.details);
    }
    showFormMessage(error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = label;
  }
}

async function handleDelete() {
  if (!state.selectedId) return;

  const project = state.projects.find((item) => item.id === state.selectedId);
  const name = project?.title || '제목 없는 프로젝트';

  if (!window.confirm(`"${name}" 을(를) 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`)) return;

  try {
    await adminApi.deleteProject(state.selectedId);
    state.selectedId = null;
    await loadProjects();
    fillForm(null);
    showToast('삭제되었습니다');
  } catch (error) {
    if (handleAuthError(error)) return;
    showFormMessage(error.message, 'error');
  }
}

async function enterAdmin() {
  showAdmin();

  try {
    state.categories = await adminApi.getCategories();
    fillCategories(state.categories);
    await loadProjects();
    startNewProject();
  } catch (error) {
    if (handleAuthError(error)) return;
    showToast(error.message);
  }
}

function bindActions() {
  $('#projectForm')?.addEventListener('submit', handleSave);
  $('#newBtn')?.addEventListener('click', startNewProject);
  $('#cancelBtn')?.addEventListener('click', () => {
    if (state.selectedId) {
      selectProject(state.selectedId);
    } else {
      startNewProject();
    }
  });
  $('#deleteBtn')?.addEventListener('click', handleDelete);

  $('#logoutBtn')?.addEventListener('click', async () => {
    await adminApi.logout();
    showLogin();
    showToast('로그아웃되었습니다');
  });

  // 공개를 고르면 어떤 칸이 필요한지 미리 알려준다.
  $('#projectForm')?.addEventListener('change', (event) => {
    if (event.target.name !== 'status') return;
    hideFormMessage();
    clearErrors();
  });
}

async function start() {
  bindActions();
  initAuth(enterAdmin);

  if (await hasValidSession()) {
    enterAdmin();
  } else {
    showLogin();
  }
}

document.addEventListener('DOMContentLoaded', start);
