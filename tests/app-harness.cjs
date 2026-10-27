const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let html = fs.readFileSync(process.env.APP_TEST_HTML || path.join(__dirname, '../src/index.template.html'), 'utf8');
const payload=html.match(/<script id="self-extract-payload"[^>]*>([^<]+)<\/script>/)||html.match(/const b='([^']+)'/)||html.match(/<script id="payload"[^>]*>([^<]+)<\/script>/);if(payload)html=require('node:zlib').gunzipSync(Buffer.from(payload[1],'base64')).toString();

// Minimal DOM boundary: run the actual inline application functions without browser dependencies.
function fixture({ rejectStorage = false, rejectRead = false, stored = new Map(), initialize = false, locale="en", url="https://example.test/" } = {}) {
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
    remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this);this.isConnected=false;}
    contains(node){return node===this||this.children.some(n=>n.contains?.(node));}
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
  const knownIds=new Set([...html.slice(0,html.indexOf("<script>")).matchAll(/\bid="([^"]+)"/g)].map(m=>"#"+m[1]));
  const get = selector => {
    if(initialize&&!knownIds.has(selector))return null;
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
  const storageWrites = [];
  const timers = new Map(); let nextTimer = 0, nextId = 0, rejection = rejectStorage,readRejection=rejectRead;
  const context = {
    document, HTMLElement: Element, window: {}, addEventListener() {},
    setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; }, clearTimeout(id) { timers.delete(id); }, requestAnimationFrame(fn) { fn(); },
    matchMedia: query => ({ matches: query.includes('reduced-motion') }),
    localStorage: { getItem: key => {if(readRejection)throw Error('blocked read');return stored.get(key)??null;}, setItem(key, value) { storageWrites.push({ key, value }); if (rejection) throw new Error('QuotaExceededError'); stored.set(key, value); } },
    crypto: { randomUUID: () => 'new-' + ++nextId, getRandomValues(array) { array.fill(0); return array; } },
    navigator: { language: locale,languages:[locale],clipboard:{async writeText(){}} }, location: { protocol: new URL(url).protocol,href:url,hash:new URL(url).hash }, URL, TextEncoder, TextDecoder, Uint8Array, Uint32Array, console,Blob,Response,CompressionStream,DecompressionStream,atob,btoa
  };
  const exports = ['state', 'translations', 'duplicateSavedList', 'saveNamedList', 'loadSavedLists', 'saveSavedLists', 'setupEvents', 'renderSavedLists', 'beginRenameSavedList', 'renameSavedList', 'cancelSavedListEdit', 'confirmSavedListUpdate', 'cancelSavedListUpdate', 'deleteSavedList', 'undoSavedListChange', 'secureRandomInt', 'secureShuffle', 'selectUnique', 'parseCandidates', 'runCurrentMode', 'setSource', 'setLanguage','saveState','init','resultText','copyResult','copyOrderResult','shareResult','shareCandidates','copyText','renderResult','AppToast','createCandidateShareUrl','readSharedCandidatesFromFragment'];
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace('__APP_CONFIG_JSON__', JSON.stringify({ slug: 'htmlapps-random-picker', version: '1.0.1' }))
    .replace('__BUILD_MANIFEST_JSON__', '{}').replace('__EMBEDDED_ASSET_BUNDLE_JSON__', '{}')
    .replace('      init();', `globalThis.api = {${exports.map(name => `${name}: typeof ${name} === 'undefined' ? undefined : ${name}`).join(',')}};${initialize?'globalThis.ready=init();':''}`);
  vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../components/ui-conventions.js'),'utf8'),context); vm.runInContext(code, context); if(!initialize)context.api.state.language = 'en';
  if(!initialize)context.api.setupEvents();
  const keydown = (target, extra = {}) => {
    const event = target.dispatch('keydown', { key: 'Enter', ...extra });
    for (const listener of document.listeners.keydown || []) listener(event);
    return event;
  };
  return {context,ready:context.ready,timers, api: context.api, get, document, stored, storageWrites, Element, keydown, rejectStorage(value) { rejection = value; },rejectRead(value){readRejection=value;}, flushTimers() { for (const [id, fn] of timers) { timers.delete(id); fn(); } } };
}
const list = (id = 'a', name = 'Class A', source = 'Alice\nBob') => ({ id, name, source, createdAt: 1, updatedAt: 2 });
const plain = value => JSON.parse(JSON.stringify(value));
module.exports = { fixture, list, plain, html, key: 'htmlapps-random-picker:saved-lists-v1' };
