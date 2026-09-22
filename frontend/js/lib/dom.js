// ==========================================
// DOM 도우미
// ------------------------------------------
// 화면을 그릴 때 쓰는 작은 함수들.
// 문자열을 innerHTML로 붙이지 않고 요소를 만들어 넣기 때문에,
// 데이터에 <, > 같은 문자가 들어 있어도 안전하다.
// ==========================================

/**
 * 요소를 만든다.
 * @param {string} tag
 * @param {object} [options] { className, text, html, attrs, dataset, children }
 */
export function el(tag, options = {}) {
  const node = document.createElement(tag);
  const { className, text, attrs, dataset, children } = options;

  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;

  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value === false || value === null || value === undefined) continue;
    node.setAttribute(key, value === true ? '' : String(value));
  }

  for (const [key, value] of Object.entries(dataset ?? {})) {
    node.dataset[key] = String(value);
  }

  for (const child of children ?? []) {
    if (child) node.append(child);
  }

  return node;
}

/** 자식을 모두 비운다. */
export function clear(node) {
  if (node) node.replaceChildren();
}

/** 여러 요소를 한 번에 넣는다. */
export function render(node, children) {
  if (!node) return;
  node.replaceChildren(...children.filter(Boolean));
}

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
