const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../src/index.template.html'), 'utf8');

// Minimal DOM boundary: run the actual inline application functions without browser dependencies.
function fixture({ rejectStorage = false, stored = new Map() } = {}) {
  let document;
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase(); this.listeners = {}; this.children = []; this.dataset = {}; this.attributes = {};
      this.style = { setProperty() {}, removeProperty() {} }; this.classes = new Set();
      this.classList = { add: value => this.classes.add(value), remove: value => this.classes.delete(value), toggle() {} };
      this.value = ''; this.textContent = ''; this.open = false; this.hidden = false; this.disabled = false; this.isConnected = true;
    }
    set innerHTML(value) { this.children = []; this.html = value; }
    get innerHTML() { return this.html || ''; }
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
    dispatch(type, extra = {}) {
      const event = { target: this, currentTarget: this, preventDefault() { this.defaultPrevented = true; }, ...extra };
      for (const listener of this.listeners[type] || []) listener(event);
      return event;
    }
    append(...children) { for (const child of children) { child.parentElement = this; this.children.push(child); } }
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return this.attributes[key] ?? null; }
    removeAttribute(key) { delete this.attributes[key]; }
    select() { this.focus(); }
    focus() { document.activeElement = this; }
    close() { this.open = false; this.dispatch('close'); }
    showModal() { this.open = true; }
    scrollIntoView() {}
    closest(selector) {
      if (selector.includes('input') && ['INPUT', 'TEXTAREA', 'SELECT'].includes(this.tagName)) return this;
      if (selector.includes('contenteditable') && this.isContentEditable) return this;
      return this.parentElement?.closest(selector) || null;
    }
  }
  const elements = new Map();
  const get = selector => {
    if (!elements.has(selector)) {
      const tag = /Input$|Name$|Search$|Count$|Size$/.test(selector) ? 'input' : selector.endsWith('Dialog') ? 'dialog' : 'div';
      const element = new Element(tag); element.id = selector.slice(1); elements.set(selector, element);
    }
    return elements.get(selector);
  };
  document = {
    body: new Element('body'), documentElement: new Element('html'), listeners: {},
    querySelector: selector => selector === 'dialog[open]' ? [...elements.values()].find(e => e.tagName === 'DIALOG' && e.open) || null : get(selector),
    querySelectorAll: selector => selector === 'dialog[open]' ? [...elements.values()].filter(e => e.tagName === 'DIALOG' && e.open) : [],
    getElementById: id => get('#' + id), createElement: tag => new Element(tag),
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  };
  const timers = new Map(); let nextTimer = 0, nextId = 0, rejection = rejectStorage;
  const context = {
    document, HTMLElement: Element, window: {}, addEventListener() {},
    setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; }, clearTimeout(id) { timers.delete(id); }, requestAnimationFrame(fn) { fn(); },
    matchMedia: query => ({ matches: query.includes('reduced-motion') }),
    localStorage: { getItem: key => stored.get(key) ?? null, setItem(key, value) { if (rejection) throw new Error('QuotaExceededError'); stored.set(key, value); } },
    crypto: { randomUUID: () => 'new-' + ++nextId, getRandomValues(array) { array.fill(0); return array; } },
    navigator: { language: 'en' }, location: { protocol: 'https:' }, URL, TextEncoder, TextDecoder, Uint8Array, Uint32Array, console
  };
  const exports = ['state', 'translations', 'saveNamedList', 'loadSavedLists', 'saveSavedLists', 'setupEvents', 'renderSavedLists', 'beginRenameSavedList', 'renameSavedList', 'cancelSavedListEdit', 'confirmSavedListUpdate', 'cancelSavedListUpdate', 'deleteSavedList', 'undoSavedListChange', 'secureRandomInt', 'secureShuffle', 'selectUnique', 'parseCandidates', 'runCurrentMode', 'setSource', 'setLanguage'];
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace('__APP_CONFIG_JSON__', JSON.stringify({ slug: 'htmlapps-random-picker', version: '1.0.1' }))
    .replace('__BUILD_MANIFEST_JSON__', '{}').replace('__EMBEDDED_ASSET_BUNDLE_JSON__', '{}')
    .replace('      init();', `globalThis.api = {${exports.map(name => `${name}: typeof ${name} === 'undefined' ? undefined : ${name}`).join(',')}};`);
  vm.createContext(context); vm.runInContext(code, context); context.api.state.language = 'en';
  context.api.setupEvents();
  const keydown = (target, extra = {}) => {
    const event = target.dispatch('keydown', { key: 'Enter', ...extra });
    for (const listener of document.listeners.keydown || []) listener(event);
    return event;
  };
  return { api: context.api, get, document, stored, Element, keydown, rejectStorage(value) { rejection = value; }, flushTimers() { for (const [id, fn] of timers) { timers.delete(id); fn(); } } };
}
const list = (id = 'a', name = 'Class A', source = 'Alice\nBob') => ({ id, name, source, createdAt: 1, updatedAt: 2 });
const plain = value => JSON.parse(JSON.stringify(value));
module.exports = { fixture, list, plain, html, key: 'htmlapps-random-picker:saved-lists-v1' };
