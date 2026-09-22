// ==========================================
// PDF 저장용 문서 만들기
// ------------------------------------------
// 예전에는 화면(DOM)을 긁어 모아 문서를 만들었다.
// 이제는 백엔드에서 받아 store에 담아 둔 데이터를 그대로 쓴다.
//  - 필터로 지금 안 보이는 프로젝트도 빠짐없이 들어간다
//  - 화면 구조를 바꿔도 PDF가 깨지지 않는다
// ==========================================

import { el, render } from '../lib/dom.js';
import { showToast } from '../lib/toast.js';
import { store } from '../store.js';

/** 이모지와 장식 문자를 걷어내 문서체로 만든다. */
function plain(value) {
  return String(value ?? '')
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{2726}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function today() {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function section(title, ...children) {
  return el('section', {
    className: 'pdf-section',
    children: [el('h2', { text: title }), ...children]
  });
}

function coverBlock(profile, date) {
  const hero = profile.hero ?? {};
  const tagline = (hero.description ?? []).join(' ');

  return el('header', {
    className: 'pdf-cover',
    children: [
      el('h1', { text: `${plain(profile.name)} 포트폴리오` }),
      el('p', { className: 'pdf-role', text: plain(hero.tag) }),
      el('p', { className: 'pdf-tagline', text: plain(tagline) }),
      el('p', { className: 'pdf-date', text: `작성일 ${date}` })
    ]
  });
}

function profileBlock(profile) {
  const rows = profile.infoTable ?? [];
  if (!rows.length) return null;

  return section(
    '기본 정보',
    el('dl', {
      className: 'pdf-kv',
      children: rows.map((row) =>
        el('div', {
          children: [el('dt', { text: plain(row.label) }), el('dd', { text: plain(row.value) })]
        })
      )
    })
  );
}

function aboutBlock(profile) {
  const cards = profile.about ?? [];
  if (!cards.length) return null;

  return section(
    '소개',
    el('div', {
      className: 'pdf-points',
      children: cards.map((card) =>
        el('div', {
          children: [el('h3', { text: plain(card.title) }), el('p', { text: plain(card.body) })]
        })
      )
    })
  );
}

function skillsBlock(skills) {
  const groups = skills?.groups ?? [];
  if (!groups.length) return null;

  const grid = el('div', {
    className: 'pdf-skills',
    children: groups.map((group) =>
      el('div', {
        children: [
          el('h3', { text: plain(group.title) }),
          ...(group.items ?? []).map((item) =>
            el('div', {
              className: 'pdf-skill',
              children: [el('span', { text: plain(item.name) }), el('b', { text: `${item.level}%` })]
            })
          )
        ]
      })
    )
  });

  const tags = skills?.tags ?? [];
  const tagLine = tags.length
    ? el('p', { className: 'pdf-tags', text: `관심 키워드 · ${tags.map(plain).join(' · ')}` })
    : null;

  return section('학습 역량', grid, tagLine);
}

function projectsBlock(projects, categories = []) {
  if (!projects.length) return null;

  const labels = new Map(categories.map((category) => [category.id, category.label]));

  const articles = projects.map((project) => {
    const children = [
      el('div', {
        className: 'pdf-proj-head',
        children: [
          el('span', {
            className: 'pdf-badge',
            text: plain(labels.get(project.category) ?? project.category)
          }),
          el('h3', { text: plain(project.title) })
        ]
      })
    ];

    const meta = [];
    if (project.date) meta.push(project.date);
    if (project.role) meta.push(project.role);
    if (project.teamSize) meta.push(`참여 ${project.teamSize}명`);

    if (meta.length) {
      children.push(el('p', { className: 'pdf-keys', text: meta.map(plain).join(' · ') }));
    }

    const paragraphs = String(project.description ?? '')
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean);

    children.push(
      el('div', {
        className: 'pdf-steps',
        children: paragraphs.map((paragraph) =>
          el('div', { className: 'pdf-step', children: [el('span', { text: plain(paragraph) })] })
        )
      })
    );

    if (project.notes) {
      children.push(el('p', { className: 'pdf-lead', text: `참고사항 · ${plain(project.notes)}` }));
    }

    if (project.link?.url) {
      children.push(el('p', { className: 'pdf-url', text: `관련 링크 · ${project.link.url}` }));
    }

    return el('article', { className: 'pdf-proj', children });
  });

  return section('프로젝트', ...articles);
}

function closingBlock(profile) {
  const message = profile.contact?.message;
  if (!message) return null;

  return section('맺음말', el('p', { className: 'pdf-note', text: plain(message) }));
}

function footBlock(profile, date) {
  return el('footer', {
    className: 'pdf-foot',
    children: [
      el('span', { text: `${plain(profile.name)} · 포트폴리오 요약 문서` }),
      el('span', { text: date })
    ]
  });
}

/** 인쇄용 문서를 다시 만든다. */
export function buildPdfDoc() {
  const target = document.getElementById('pdfDoc');
  const profile = store.profile;

  if (!target || !profile) return null;

  const date = today();

  render(target, [
    coverBlock(profile, date),
    profileBlock(profile),
    aboutBlock(profile),
    skillsBlock(store.skills),
    projectsBlock(store.allProjects, store.categories),
    closingBlock(profile),
    footBlock(profile, date)
  ]);

  return profile;
}

export function initPdf() {
  // 미리 만들어 두면 브라우저 인쇄(Ctrl+P)로 저장해도 같은 문서가 나온다.
  buildPdfDoc();
  window.addEventListener('beforeprint', buildPdfDoc);
}

/** 공유 메뉴의 "PDF 공유"를 눌렀을 때 */
export function printPdf() {
  const profile = buildPdfDoc();

  if (!profile) {
    showToast('아직 내용을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
    return;
  }

  // 저장 대화상자의 기본 파일 이름을 문서 제목으로 맞춘다
  const originalTitle = document.title;
  document.title = `${plain(profile.name)}_포트폴리오`;

  const restore = () => {
    document.title = originalTitle;
  };

  window.addEventListener('afterprint', restore, { once: true });
  setTimeout(restore, 60000);

  showToast('인쇄 창에서 "PDF로 저장"을 선택하세요');
  requestAnimationFrame(() => window.print());
}
