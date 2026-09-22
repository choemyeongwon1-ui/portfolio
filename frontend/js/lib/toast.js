// ==========================================
// 짧은 안내 메시지 (toast)
// ==========================================

import { $ } from './dom.js';

let timer = null;

export function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;

  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('show'));

  clearTimeout(timer);
  timer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.hidden = true;
    }, 250);
  }, 2600);
}
