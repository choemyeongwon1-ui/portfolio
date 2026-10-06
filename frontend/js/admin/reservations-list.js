// ==========================================
// 예약 목록 — 테이블 그리기
// ==========================================

import { el, render } from '../lib/dom.js';

// 백엔드(reservations.service.js)와 순서·이름을 맞춘다.
export const RESERVATION_STATUSES = ['접수', '확정', '변경 요청', '취소'];

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

/**
 * @param {object[]} reservations
 * @param {(id: string, status: string) => void} onChangeStatus
 */
export function renderReservations(reservations, onChangeStatus) {
  const tbody = document.getElementById('reservationRows');
  const empty = document.getElementById('reservationsEmpty');
  const count = document.getElementById('listCount');

  count.textContent = `전체 ${reservations.length}건`;
  empty.hidden = reservations.length > 0;

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
