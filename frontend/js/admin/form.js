// ==========================================
// 관리자 — 입력 양식
// ------------------------------------------
// 검증 규칙
//   초안   : 빈칸이 있어도 저장된다
//   공개   : 참고사항·링크를 뺀 모든 칸이 채워져야 저장된다
//
// 같은 규칙을 서버도 따로 확인한다. 화면 검사는 편의를 위한 것이고,
// 실제로 저장을 막는 최종 판단은 서버가 한다.
// ==========================================

import { el, render, $, $$ } from '../lib/dom.js';
import { withJosa } from '../lib/josa.js';

// 공개하려면 채워야 하는 칸
const REQUIRED_FOR_PUBLISH = [
  { name: 'title', label: '제목' },
  { name: 'category', label: '분야' },
  { name: 'date', label: '날짜' },
  { name: 'role', label: '내가 한 역할' },
  { name: 'teamSize', label: '참여인원 수' },
  { name: 'description', label: '설명' }
];

const FIELDS = [
  'title',
  'category',
  'date',
  'role',
  'teamSize',
  'description',
  'notes',
  'linkUrl',
  'linkLabel'
];

function fieldInput(name) {
  return $(`[name="${name}"]`, $('#projectForm'));
}

/** 칸 아래에 빨간 글씨로 오류를 표시한다. */
export function clearErrors() {
  $$('.field', $('#projectForm')).forEach((field) => field.classList.remove('has-error'));
  $$('.field-error').forEach((node) => {
    node.textContent = '';
  });
}

export function showFieldErrors(errors) {
  clearErrors();

  let firstInput = null;

  for (const error of errors) {
    const slot = $(`[data-error-for="${error.field}"]`);
    if (slot) slot.textContent = error.message;

    const input = fieldInput(error.field);
    input?.closest('.field')?.classList.add('has-error');

    if (!firstInput && input) firstInput = input;
  }

  firstInput?.focus();
}

export function showFormMessage(message, kind = 'error') {
  const box = $('#formMessage');
  if (!box) return;

  box.textContent = message;
  box.className = `form-message is-${kind}`;
  box.hidden = !message;
}

export function hideFormMessage() {
  const box = $('#formMessage');
  if (box) box.hidden = true;
}

/** 분야 선택 상자를 채운다. */
export function fillCategories(categories) {
  const select = $('#fCategory');
  if (!select) return;

  // 'all'은 필터 전용이라 프로젝트에 지정할 수 없다.
  const options = [
    el('option', { text: '분야를 선택하세요', attrs: { value: '' } }),
    ...categories
      .filter((category) => category.id !== 'all')
      .map((category) => el('option', { text: category.label, attrs: { value: category.id } }))
  ];

  render(select, options);
}

/** 양식의 현재 값을 모아 서버로 보낼 형태로 만든다. */
export function readForm() {
  const form = $('#projectForm');
  const values = {};

  for (const name of FIELDS) {
    values[name] = fieldInput(name)?.value.trim() ?? '';
  }

  values.status = $('[name="status"]:checked', form)?.value ?? 'draft';
  return values;
}

/** 프로젝트 내용을 양식에 채운다. null이면 빈 양식. */
export function fillForm(project) {
  const form = $('#projectForm');
  if (!form) return;

  clearErrors();
  hideFormMessage();

  const values = {
    title: project?.title ?? '',
    category: project?.category ?? '',
    date: project?.date ?? '',
    role: project?.role ?? '',
    teamSize: project?.teamSize ?? '',
    description: project?.description ?? '',
    notes: project?.notes ?? '',
    linkUrl: project?.link?.url ?? '',
    linkLabel: project?.link?.label ?? ''
  };

  for (const [name, value] of Object.entries(values)) {
    const input = fieldInput(name);
    if (input) input.value = value;
  }

  const status = project?.status === 'published' ? 'published' : 'draft';
  const radio = $(`[name="status"][value="${status}"]`, form);
  if (radio) radio.checked = true;

  // 제목과 버튼 문구를 상황에 맞게 바꾼다.
  const isNew = !project;
  $('#formTitle').textContent = isNew ? '새 프로젝트' : '프로젝트 수정';
  $('#formSub').textContent = isNew
    ? '칸을 채우고 아래에서 초안 또는 공개를 고르세요'
    : '내용을 고친 뒤 저장을 누르면 사이트에 반영됩니다';
  $('#saveBtn').textContent = isNew ? '새로 저장' : '수정 저장';
  $('#deleteBtn').hidden = isNew;
}

/**
 * 저장 전에 화면에서 먼저 확인한다.
 * @returns {{field: string, message: string}[]} 문제가 없으면 빈 배열
 */
export function validateForm(values) {
  const errors = [];

  if (values.teamSize !== '') {
    const number = Number(values.teamSize);
    if (!Number.isInteger(number) || number < 1) {
      errors.push({ field: 'teamSize', message: '1 이상의 숫자를 입력해 주세요.' });
    }
  }

  if (values.linkUrl && !/^https?:\/\//i.test(values.linkUrl)) {
    errors.push({ field: 'linkUrl', message: 'http:// 또는 https:// 로 시작해야 합니다.' });
  }

  // 초안은 빈칸을 허용한다.
  if (values.status !== 'published') return errors;

  for (const { name, label } of REQUIRED_FOR_PUBLISH) {
    if (!values[name]) {
      errors.push({ field: name, message: `공개하려면 ${withJosa(label)} 입력해야 합니다.` });
    }
  }

  return errors;
}
