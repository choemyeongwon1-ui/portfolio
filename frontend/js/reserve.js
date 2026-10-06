// ==========================================
// 방문 예약 페이지
// ------------------------------------------
// 캘린더(주말·공휴일 제외) + 시간 선택 + 연락 정보 입력 + 최종 확인 팝업 순서로 동작한다.
// ==========================================

import { reservationsApi } from './api/reservations.api.js';
import { ApiError } from './api/client.js';

const $ = (id) => document.getElementById(id);

/* 1. 공휴일 · 시간 범위 ----------------------------------------------------- */

// 2026년 대한민국 공휴일(대체공휴일 포함). backend/src/services/reservations.service.js 와 맞춰 둔다.
const HOLIDAYS_2026 = new Set([
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18',
  '2026-03-01', '2026-03-02', '2026-05-05', '2026-05-24', '2026-05-25',
  '2026-06-06', '2026-08-15', '2026-08-17',
  '2026-09-24', '2026-09-25', '2026-09-26',
  '2026-10-03', '2026-10-05', '2026-10-09', '2026-12-25'
]);

function toDateKey(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function isSelectableDate(year, month, day) {
  const date = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return false;

  const weekday = date.getDay();
  if (weekday === 0 || weekday === 6) return false; // 주말 제외

  return !HOLIDAYS_2026.has(toDateKey(year, month, day));
}

function buildTimeOptions() {
  const times = [];
  for (let minutes = 13 * 60; minutes <= 18 * 60; minutes += 30) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    times.push(`${h}:${m}`);
  }
  return times;
}

/* 2. 상태 ------------------------------------------------------------------ */

const today = new Date();
const state = {
  viewYear: today.getFullYear(),
  viewMonth: today.getMonth(), // 0-11
  selectedDate: null // 'YYYY-MM-DD'
};

/* 3. 캘린더 그리기 ----------------------------------------------------------- */

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

function renderCalendar() {
  const grid = $('cal-grid');
  const label = $('cal-month-label');
  const { viewYear, viewMonth } = state;

  label.textContent = `${viewYear}년 ${viewMonth + 1}월`;

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  grid.replaceChildren();

  for (let i = 0; i < firstWeekday; i += 1) {
    grid.appendChild(document.createElement('span'));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = toDateKey(viewYear, viewMonth, day);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = String(day);
    btn.className = 'cal-day';

    const selectable = isSelectableDate(viewYear, viewMonth, day);
    if (!selectable) {
      btn.classList.add('is-disabled');
      btn.disabled = true;
    }
    if (key === state.selectedDate) {
      btn.classList.add('is-selected');
    }

    btn.addEventListener('click', () => {
      state.selectedDate = key;
      renderCalendar();
      updateSelectedDateText();
      updateSubmitEnabled();
    });

    grid.appendChild(btn);
  }

  // 이전 달 이동은 오늘이 속한 달까지만 허용한다.
  const isAtCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  $('cal-prev').disabled = isAtCurrentMonth;
}

function updateSelectedDateText() {
  const el = $('selected-date-text');
  if (!state.selectedDate) {
    el.textContent = '날짜를 선택해 주세요';
    el.classList.remove('has-value');
    return;
  }
  const [y, m, d] = state.selectedDate.split('-').map(Number);
  const weekday = WEEKDAY_LABEL[new Date(y, m - 1, d).getDay()];
  el.textContent = `${y}년 ${m}월 ${d}일 (${weekday})`;
  el.classList.add('has-value');
}

$('cal-prev').addEventListener('click', () => {
  state.viewMonth -= 1;
  if (state.viewMonth < 0) {
    state.viewMonth = 11;
    state.viewYear -= 1;
  }
  renderCalendar();
});

$('cal-next').addEventListener('click', () => {
  state.viewMonth += 1;
  if (state.viewMonth > 11) {
    state.viewMonth = 0;
    state.viewYear += 1;
  }
  renderCalendar();
});

/* 4. 시간 드롭다운 ----------------------------------------------------------- */

const timeSelect = $('time-select');
for (const t of buildTimeOptions()) {
  const option = document.createElement('option');
  option.value = t;
  option.textContent = t;
  timeSelect.appendChild(option);
}
timeSelect.addEventListener('change', updateSubmitEnabled);

/* 5. 입력 필드 검증 ----------------------------------------------------------- */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const nameInput = $('name-input');
const emailInput = $('email-input');
const purposeInput = $('purpose-input');
const emailError = $('email-error');
const agreeCheckbox = $('agree-checkbox');
const submitBtn = $('submit-btn');

function isEmailValid() {
  return EMAIL_PATTERN.test(emailInput.value.trim());
}

function updateEmailFeedback() {
  const value = emailInput.value.trim();
  const showError = value.length > 0 && !isEmailValid();
  emailError.hidden = !showError;
  emailInput.classList.toggle('is-invalid', showError);
}

function updateSubmitEnabled() {
  const ready =
    Boolean(state.selectedDate) &&
    Boolean(timeSelect.value) &&
    nameInput.value.trim().length > 0 &&
    isEmailValid() &&
    purposeInput.value.trim().length > 0 &&
    agreeCheckbox.checked;

  submitBtn.disabled = !ready;
}

[nameInput, purposeInput].forEach((el) => el.addEventListener('input', updateSubmitEnabled));
emailInput.addEventListener('input', () => {
  updateEmailFeedback();
  updateSubmitEnabled();
});
agreeCheckbox.addEventListener('change', updateSubmitEnabled);

/* 6. 확인 팝업 → 제출 -------------------------------------------------------- */

const confirmOverlay = $('confirm-overlay');
const successOverlay = $('success-overlay');
const formError = $('form-error');
const confirmError = $('confirm-error');
const confirmSubmitBtn = $('confirm-submit');

function currentPayload() {
  return {
    date: state.selectedDate,
    time: timeSelect.value,
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    purpose: purposeInput.value.trim(),
    agree: agreeCheckbox.checked
  };
}

function openConfirmOverlay() {
  const payload = currentPayload();
  const [y, m, d] = payload.date.split('-').map(Number);
  const weekday = WEEKDAY_LABEL[new Date(y, m - 1, d).getDay()];

  $('confirm-date').textContent = `${y}년 ${m}월 ${d}일 (${weekday})`;
  $('confirm-time').textContent = payload.time;
  $('confirm-name').textContent = payload.name;
  $('confirm-email').textContent = payload.email;
  $('confirm-purpose').textContent = payload.purpose;

  confirmError.hidden = true;
  confirmOverlay.hidden = false;
}

function closeConfirmOverlay() {
  confirmOverlay.hidden = true;
}

$('reserve-form').addEventListener('submit', (event) => {
  event.preventDefault();
  formError.hidden = true;
  if (submitBtn.disabled) return;
  openConfirmOverlay();
});

$('confirm-edit').addEventListener('click', closeConfirmOverlay);

confirmSubmitBtn.addEventListener('click', async () => {
  confirmSubmitBtn.disabled = true;
  confirmSubmitBtn.textContent = '처리 중...';
  confirmError.hidden = true;

  try {
    await reservationsApi.create(currentPayload());
    confirmOverlay.hidden = true;
    successOverlay.hidden = false;
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.details?.[0]?.message ?? err.message
        : '예약 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    confirmError.textContent = message;
    confirmError.hidden = false;
  } finally {
    confirmSubmitBtn.disabled = false;
    confirmSubmitBtn.textContent = '예약 확정';
  }
});

/* 7. 시작 -------------------------------------------------------------------- */

renderCalendar();
updateSelectedDateText();
updateSubmitEnabled();
