// ==========================================
// 공유하기 — 메뉴 열고 닫기 + 링크 복사
// (PDF 저장은 features/pdf.js 가 맡는다)
// ==========================================

import { $ } from '../lib/dom.js';
import { showToast } from '../lib/toast.js';

function legacyCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';

  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(area);

  return ok;
}

export function initShare({ onPdfRequest } = {}) {
  const shareBtn = $('#shareBtn');
  const shareMenu = $('#shareMenu');
  const shareLinkBtn = $('#shareLinkBtn');
  const sharePdfBtn = $('#sharePdfBtn');

  if (!shareBtn || !shareMenu) return;

  const setShareMenu = (open) => {
    shareMenu.hidden = !open;
    shareBtn.setAttribute('aria-expanded', String(open));
  };

  shareBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    setShareMenu(shareMenu.hidden);
  });

  document.addEventListener('click', (event) => {
    if (shareMenu.hidden) return;
    if (shareMenu.contains(event.target) || shareBtn.contains(event.target)) return;
    setShareMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !shareMenu.hidden) {
      setShareMenu(false);
      shareBtn.focus();
    }
  });

  shareLinkBtn?.addEventListener('click', async () => {
    setShareMenu(false);

    const url = window.location.href;
    const isLocalFile = window.location.protocol === 'file:';

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else if (!legacyCopy(url)) {
        throw new Error('copy rejected');
      }
      showToast(isLocalFile ? '파일 경로를 복사했습니다' : '링크를 복사했습니다');
    } catch {
      showToast('복사하지 못했습니다. 주소창에서 직접 복사해 주세요.');
    }
  });

  sharePdfBtn?.addEventListener('click', () => {
    setShareMenu(false);
    onPdfRequest?.();
  });
}
