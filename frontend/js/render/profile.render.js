// ==========================================
// 프로필 화면 그리기
// ------------------------------------------
// 백엔드에서 받은 profile 데이터를 index.html의 빈 자리에 채운다.
// 클래스 이름은 기존 style.css와 그대로 맞춰 두었다.
// 이모지·장식 문자는 화면에 그릴 때만 걷어 낸다 (데이터 자체는 그대로).
// ==========================================

import { el, render, $ } from '../lib/dom.js';
import { plain } from '../lib/text.js';

function renderHero(profile) {
  const hero = profile.hero ?? {};

  const tag = $('#heroTag');
  if (tag) tag.textContent = plain(hero.tag);

  const title = $('#heroTitle');
  if (title) {
    render(title, [
      document.createTextNode(plain(hero.titleLead)),
      el('br'),
      document.createTextNode(`${plain(hero.titleBefore)} `),
      el('em', { text: plain(hero.titleHighlight) }),
      document.createTextNode(plain(hero.titleAfter))
    ]);
  }

  const desc = $('#heroDesc');
  if (desc) {
    const lines = hero.description ?? [];
    const nodes = [];
    lines.forEach((line, index) => {
      if (index > 0) nodes.push(el('br'));
      nodes.push(document.createTextNode(plain(line)));
    });
    render(desc, nodes);
  }
}

function renderProfileCard(profile) {
  const avatarName = $('#avatarName');
  if (avatarName) avatarName.textContent = plain(profile.name);

  const list = $('#profileCardList');
  if (!list) return;

  render(
    list,
    (profile.card ?? []).map((item) =>
      el('li', {
        children: [
          el('div', {
            children: [
              el('small', { text: plain(item.label) }),
              el('strong', { text: plain(item.value) })
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
    (profile.about ?? []).map((card, index) =>
      el('div', {
        className: 'acard',
        attrs: { id: card.id },
        children: [
          el('span', { className: 'acard-no', text: String(index + 1).padStart(2, '0') }),
          el('h3', { text: plain(card.title) }),
          el('p', { text: plain(card.body) })
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
        children: [el('label', { text: plain(item.label) }), el('span', { text: plain(item.value) })]
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
            el('div', {
              children: [el('small', { text: plain(card.label) }), el('strong', { text: plain(card.value) })]
            })
          ]
        })
      )
    );
  }

  const bubble = $('#msgBubble');
  if (bubble) {
    render(bubble, [
      el('p', { className: 'msg-hi', text: plain(contact.greeting) }),
      el('p', { text: plain(contact.message) })
    ]);
  }
}

function renderChrome(profile) {
  const brand = $('#navBrand');
  if (brand) {
    render(brand, [
      document.createTextNode(plain(profile.brand ?? profile.name)),
      el('span', { className: 'brand-dot', text: '.' })
    ]);
  }

  const footer = profile.footer ?? {};
  const name = $('#footerName');
  const info = $('#footerInfo');
  const copy = $('#footerCopy');

  if (name) name.textContent = plain(footer.name);
  if (info) info.textContent = plain(footer.info);
  if (copy) copy.textContent = plain(footer.copyright);

  if (profile.name) {
    document.title = `${plain(profile.name)} 포트폴리오`;
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
