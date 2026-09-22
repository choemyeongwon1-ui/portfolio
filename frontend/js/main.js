// ==========================================
// 프론트엔드 진입점
// ------------------------------------------
// 1) 백엔드에서 데이터를 받아 store에 담고
// 2) 화면을 그린 뒤
// 3) 상호작용(메뉴·필터·공유 등)을 연결한다.
//
// 데이터를 받아오는 일과 화면을 그리는 일이 나뉘어 있어서,
// 나중에 백엔드가 DB를 쓰든 다른 API를 쓰든 이 파일은 그대로다.
// ==========================================

import { portfolioApi } from './api/portfolio.api.js';
import { store, setState } from './store.js';
import { $ } from './lib/dom.js';
import { showToast } from './lib/toast.js';

import { renderProfile } from './render/profile.render.js';
import { renderSkills } from './render/skills.render.js';

import { initNavbar } from './features/navbar.js';
import { observeReveal, bindTagHover, initPageFade } from './features/reveal.js';
import { initProjects } from './features/projects.js';
import { initShare } from './features/share.js';
import { initPdf, printPdf } from './features/pdf.js';

function showFatalError(message) {
  const banner = $('#appError');
  if (!banner) return;

  banner.textContent = `${message} (터미널에서 npm run dev 를 실행하세요)`;
  banner.hidden = false;
}

async function loadData() {
  // 서로 기다릴 필요가 없으니 한꺼번에 요청한다.
  const [profile, skills, categories, projects] = await Promise.all([
    portfolioApi.getProfile(),
    portfolioApi.getSkills(),
    portfolioApi.getCategories(),
    portfolioApi.getProjects('all')
  ]);

  setState({
    profile,
    skills,
    categories,
    allProjects: projects?.items ?? [],
    currentCategory: 'all'
  });
}

async function start() {
  // 데이터가 없어도 동작하는 기능은 먼저 켠다.
  initNavbar();
  initShare({ onPdfRequest: printPdf });

  try {
    await loadData();
  } catch (error) {
    showFatalError(error.message);
    showToast('데이터를 불러오지 못했습니다.');
    return;
  }

  renderProfile(store.profile);
  renderSkills(store.skills);
  await initProjects();

  // 화면이 다 그려진 뒤에 등장 효과를 건다.
  observeReveal();
  bindTagHover();
  initPdf();
}

document.addEventListener('DOMContentLoaded', () => {
  initPageFade();
  start();
});
