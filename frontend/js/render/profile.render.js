// ==========================================
// 프로필 화면 그리기
// ------------------------------------------
// 백엔드에서 받은 profile 데이터를 index.html의 빈 자리에 채운다.
// 클래스 이름은 기존 style.css와 그대로 맞춰 두었다.
// ==========================================

import { el, render, $ } from '../lib/dom.js';

function renderHero(profile) {
  const hero = profile.hero ?? {};

  const tag = $('#heroTag');
  if (tag) tag.textContent = hero.tag ?? '';

  const title = $('#heroTitle');
  if (title) {
    render(title, [
      document.createTextNode(hero.titleLead ?? ''),
      el('br'),
      document.createTextNode(hero.titleBefore ?? ''),
      el('em', { text: hero.titleHighlight ?? '' }),
      document.createTextNode(hero.titleAfter ?? '')
    ]);
  }

  const desc = $('#heroDesc');
  if (desc) {
    const lines = hero.description ?? [];
    const nodes = [];
    lines.forEach((line, index) => {
      if (index > 0) nodes.push(el('br'));
      nodes.push(document.createTextNode(line));
    });
    render(desc, nodes);
  }
}

function renderProfileCard(profile) {
  const avatarName = $('#avatarName');
  if (avatarName) avatarName.textContent = profile.name ?? '';

  const list = $('#profileCardList');
  if (!list) return;

  render(
    list,
    (profile.card ?? []).map((item) =>
      el('li', {
        children: [
          el('span', { className: 'ci-icon', text: item.icon }),
          el('div', {
            children: [
              el('small', { text: item.label }),
              el('strong', { text: item.value })
            ]
          })
        ]
      })
    )
  );
}

function renderAbout(profile) {
  const grid = $('#aboutGrid');
  if (!grid) return;

  render(
    grid,
    (profile.about ?? []).map((card) =>
      el('div', {
        className: 'acard',
        attrs: { id: card.id },
        children: [
          el('span', { className: 'acard-emoji', text: card.emoji }),
          el('h3', { text: card.title }),
          el('p', { text: card.body })
        ]
      })
    )
  );
}

function renderInfoTable(profile) {
  const row = $('#infoRow');
  if (!row) return;

  render(
    row,
    (profile.infoTable ?? []).map((item) =>
      el('div', {
        className: 'info-item',
        children: [el('label', { text: item.label }), el('span', { text: item.value })]
      })
    )
  );
}

function renderContact(profile) {
  const contact = profile.contact ?? {};

  const cards = $('#contactCards');
  if (cards) {
    render(
      cards,
      (contact.cards ?? []).map((card) =>
        el('div', {
          className: 'ct-card',
          attrs: { id: card.id },
          children: [
            el('span', { text: card.icon }),
            el('div', {
              children: [el('small', { text: card.label }), el('strong', { text: card.value })]
            })
          ]
        })
      )
    );
  }

  const bubble = $('#msgBubble');
  if (bubble) {
    render(bubble, [
      el('p', { className: 'msg-hi', text: contact.greeting ?? '' }),
      el('p', { text: contact.message ?? '' }),
      el('div', {
        className: 'msg-footer',
        children: (contact.decorations ?? []).map((emoji) => el('span', { text: emoji }))
      })
    ]);
  }
}

function renderChrome(profile) {
  const brand = $('#navBrand');
  if (brand) brand.textContent = profile.brand ?? profile.name ?? '';

  const footer = profile.footer ?? {};
  const name = $('#footerName');
  const info = $('#footerInfo');
  const copy = $('#footerCopy');

  if (name) name.textContent = footer.name ?? '';
  if (info) info.textContent = footer.info ?? '';
  if (copy) copy.textContent = footer.copyright ?? '';

  if (profile.name) {
    document.title = `${profile.name} 포트폴리오 🌿`;
  }
}

export function renderProfile(profile) {
  if (!profile) return;

  renderChrome(profile);
  renderHero(profile);
  renderProfileCard(profile);
  renderAbout(profile);
  renderInfoTable(profile);
  renderContact(profile);
}
