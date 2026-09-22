// ==========================================
// 네비게이션 — 스크롤 효과 + 모바일 메뉴
// (기존 script.js에서 옮겨온 코드)
// ==========================================

import { $, $$ } from '../lib/dom.js';

export function initNavbar() {
  const navbar = $('#navbar');
  const navToggle = $('#navToggle');
  const navLinks = $('.nav-links');

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  if (!navToggle || !navLinks) return;

  let navOpen = false;

  navToggle.addEventListener('click', () => {
    navOpen = !navOpen;

    if (navOpen) {
      Object.assign(navLinks.style, {
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        top: '100%',
        left: '0',
        right: '0',
        background: 'rgba(240,237,230,0.97)',
        padding: '1.2rem 6%',
        gap: '1rem',
        borderBottom: '1.5px solid rgba(156,169,152,0.3)',
        backdropFilter: 'blur(16px)'
      });
    } else {
      navLinks.style.display = 'none';
    }
  });

  $$('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        navLinks.style.display = 'none';
        navOpen = false;
      }
    });
  });
}
