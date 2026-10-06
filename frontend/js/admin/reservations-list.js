// ==========================================
// 예약 목록 — 요약 문장 · 상태 필터 · 테이블 그리기
// ==========================================

import { el, render } from '../lib/dom.js';

// 백엔드(reservations.service.js)와 순서·이름을 맞춘다.
export const RESERVATION_STATUSES = ['접수', '확정', '변경 요청', '취소'];

// 필터 탭 목록. 'all'은 전체 보기.
export const RESERVATION_FILTERS = ['all', ...RESERVATION_STATUSES];

const STATUS_CLASS = {
  접수: 'status-received',
  확정: 'status-confirmed',
  '변경 요청': 'status-change',
  취소: 'status-cancelled'
};

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

function formatVisitTime(date, time) {
  if (!date) return '-';
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAY_LABEL[new Date(y, m - 1, d).getDay()];
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${weekday}) ${time ?? ''}`;
}

/** 전체 N건 / 접수 N건 / 확정 N건 / 변경 요청 N건 / 취소 N건 */
export function renderSummary(allReservations) {
  const el2 = document.getElementById('reservationsSummary');
  const counts = Object.fromEntries(RESERVATION_STATUSES.map((status) => [status, 0]));

  for (const r of allReservations) {
    if (counts[r.status] !== undefined) counts[r.status] += 1;
  }

  const parts = [
    `전체 ${allReservations.length}건`,
    ...RESERVATION_STATUSES.map((status) => `${status} ${counts[status]}건`)
  ];
  el2.textContent = parts.join('  ·  ');
}

/**
 * 상태 필터 탭을 그린다.
 * @param {string} activeFilter 'all' 또는 RESERVATION_STATUSES 중 하나
 * @param {object[]} allReservations 탭마다 건수를 작게 표시하기 위해 받는다
 * @param {(filter: string) => void} onSelect
 */
export function renderFilterButtons(activeFilter, allReservations, onSelect) {
  const wrap = document.getElementById('statusFilter');

  const counts = Object.fromEntries(RESERVATION_STATUSES.map((status) => [status, 0]));
  for (const r of allReservations) {
    if (counts[r.status] !== undefined) counts[r.status] += 1;
  }

  const buttons = RESERVATION_FILTERS.map((filter) => {
    const label = filter === 'all' ? '전체' : filter;
    const count = filter === 'all' ? allReservations.length : counts[filter];
    const statusClass = filter === 'all' ? '' : STATUS_CLASS[filter];

    const btn = el('button', {
      className: `filter-btn ${statusClass}${filter === activeFilter ? ' is-active' : ''}`.trim(),
      text: `${label} ${count}`,
      attrs: { type: 'button', role: 'tab', 'aria-selected': String(filter === activeFilter) }
    });
    btn.addEventListener('click', () => onSelect(filter));
    return btn;
  });

  render(wrap, buttons);
}

/**
 * @param {object[]} reservations 이미 필터가 적용된 목록
 * @param {(id: string, status: string) => void} onChangeStatus
 * @param {string} activeFilter 빈 목록일 때 안내 문구를 다르게 보여주기 위해 받는다
 */
export function renderReservations(reservations, onChangeStatus, activeFilter = 'all') {
  const tbody = document.getElementById('reservationRows');
  const empty = document.getElementById('reservationsEmpty');

  empty.hidden = reservations.length > 0;
  empty.textContent =
    activeFilter === 'all'
      ? '아직 들어온 예약 요청이 없습니다.'
      : `"${activeFilter}" 상태인 예약이 없습니다.`;

  const rows = reservations.map((reservation) => {
    const statusClass = STATUS_CLASS[reservation.status] ?? 'status-received';

    const applicantCell = el('td', {
      children: [
        el('div', { className: 'applicant-name', text: reservation.name }),
        el('div', { className: 'applicant-email', text: reservation.email })
      ]
    });

    const statusBadge = el('span', {
      className: `status-badge ${statusClass}`,
      text: reservation.status ?? '접수'
    });

    const actionButtons = RESERVATION_STATUSES.map((status) =>
      el('button', {
        className: `status-btn ${STATUS_CLASS[status]}${status === reservation.status ? ' is-active' : ''}`,
        text: status,
        attrs: { type: 'button' }
      })
    );
    actionButtons.forEach((btn, i) => {
      btn.addEventListener('click', () => onChangeStatus(reservation.id, RESERVATION_STATUSES[i]));
    });

    return el('tr', {
      children: [
        el('td', { className: 'code-cell', text: reservation.code ?? '-' }),
        applicantCell,
        el('td', { text: formatVisitTime(reservation.date, reservation.time) }),
        el('td', { className: 'purpose-cell', text: reservation.purpose }),
        el('td', { children: [statusBadge] }),
        el('td', { className: 'actions-cell', children: actionButtons })
      ]
    });
  });

  render(tbody, rows);
}
