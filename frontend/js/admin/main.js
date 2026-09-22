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
  hideFormMessage,
  syncStatusUi
} from './form.js';
import {
  showTitleHint,
  showDuplicatePanel,
  hideDuplicatePanel,
  renderDuplicateBanner,
  mergeInto
} from './duplicate.js';

const state = {
  projects: [],
  categories: [],
  selectedId: null,
  // 지금 양식에 올려둔 프로젝트의 "저장된" 모습.
  // 상태를 바꿀 때 "사이트에서 내려갑니다" 같은 안내를 하려면 필요하다.
  selected: null
};

/** 지금 고른 프로젝트를 양식에 표시한다. */
function selectProject(id) {
  state.selectedId = id;
  state.selected = state.projects.find((item) => item.id === id) ?? null;

  hideDuplicatePanel();
  $('#dupHint').hidden = true;

  fillForm(state.selected);
  renderList(state.projects, state.categories, state.selectedId, selectProject);
}

function startNewProject() {
  state.selectedId = null;
  state.selected = null;

  hideDuplicatePanel();
  $('#dupHint').hidden = true;

  fillForm(null);
  renderList(state.projects, state.categories, null, selectProject);
  $('#fTitle')?.focus();
}

async function loadProjects() {
  const result = await adminApi.listProjects();
  state.projects = result?.items ?? [];
  renderList(state.projects, state.categories, state.selectedId, selectProject);
  await loadDuplicateBanner();
}

/** 이미 저장된 것들 중 겹치는 묶음을 목록 위에 보여준다. */
async function loadDuplicateBanner() {
  try {
    const groups = await adminApi.getDuplicates();
    renderDuplicateBanner(groups, {
      onOpen: selectProject,
      onDelete: (id) => removeProject(id)
    });
  } catch {
    // 중복 안내는 없어도 관리 기능에는 지장이 없으므로 조용히 넘어간다.
  }
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

/**
 * 저장한다.
 * @param {{ allowDuplicate?: boolean }} [options] 중복 경고를 무시하고 저장할지
 */
async function handleSave(event, { allowDuplicate = false } = {}) {
  event?.preventDefault?.();

  const saveBtn = $('#saveBtn');
  const values = readForm();

  clearErrors();
  hideFormMessage();
  hideDuplicatePanel();

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

  const payload = allowDuplicate ? { ...values, allowDuplicate: true } : values;

  try {
    const saved = state.selectedId
      ? await adminApi.updateProject(state.selectedId, payload)
      : await adminApi.createProject(payload);

    state.selectedId = saved.id;
    state.selected = saved;
    await loadProjects();
    fillForm(saved);
    renderList(state.projects, state.categories, state.selectedId, selectProject);

    showFormMessage(
      saved.status === 'published'
        ? '저장했습니다. 사이트에 공개되었습니다.'
        : '초안으로 임시저장했습니다. 방문자에게는 보이지 않으며, 다음에 들어와도 이 내용 그대로 남아 있습니다.',
      'success'
    );
    showToast(saved.status === 'published' ? '공개되었습니다' : '임시저장되었습니다');
  } catch (error) {
    if (handleAuthError(error)) return;

    // 중복이면 막지 말고 어떻게 할지 묻는다.
    if (error.status === 409 && error.duplicate) {
      showDuplicatePanel(error.duplicate, {
        onMerge: (existing) => mergeWithExisting(existing, values),
        onSaveAnyway: () => handleSave(null, { allowDuplicate: true })
      });
      showFormMessage(error.message, 'error');
      return;
    }

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

/**
 * 중복으로 걸린 기존 프로젝트를 불러와, 지금 쓴 값으로 빈 칸만 채운다.
 * 바로 저장하지 않는다 — 합쳐진 모습을 눈으로 확인하고 저장하도록.
 */
function mergeWithExisting(existing, values) {
  hideDuplicatePanel();

  const merged = mergeInto(existing, values);

  state.selectedId = existing.id;
  state.selected = existing;

  fillForm(merged);
  renderList(state.projects, state.categories, state.selectedId, selectProject);

  showFormMessage(
    '기존 프로젝트를 불러와 빈 칸만 채웠습니다. 내용을 확인한 뒤 저장하세요. ' +
      '기존에 값이 있던 칸은 바뀌지 않았습니다.',
    'success'
  );
}

/** id로 삭제한다 (양식의 삭제 버튼과 중복 안내의 삭제 버튼이 함께 쓴다) */
async function removeProject(id) {
  const project = state.projects.find((item) => item.id === id);
  const name = project?.title || '제목 없는 프로젝트';

  if (!window.confirm(`"${name}" 을(를) 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`)) return;

  try {
    await adminApi.deleteProject(id);

    if (state.selectedId === id) {
      state.selectedId = null;
      state.selected = null;
      fillForm(null);
    }

    await loadProjects();
    showToast('삭제되었습니다');
  } catch (error) {
    if (handleAuthError(error)) return;
    showFormMessage(error.message, 'error');
  }
}

function handleDelete() {
  if (!state.selectedId) return;
  return removeProject(state.selectedId);
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

  // 초안/공개를 바꾸면 버튼 문구와 안내를 즉시 맞춘다.
  $('#projectForm')?.addEventListener('change', (event) => {
    if (event.target.name !== 'status') return;
    hideFormMessage();
    clearErrors();
    syncStatusUi(state.selected);
  });

  // 칸을 채우는 동안 안내를 갱신한다.
  $('#projectForm')?.addEventListener('input', () => {
    syncStatusUi(state.selected);
    // 제목·링크를 쓰는 동안 같은 프로젝트가 있는지 미리 알려준다.
    showTitleHint(readForm(), state.projects, state.selectedId);
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
