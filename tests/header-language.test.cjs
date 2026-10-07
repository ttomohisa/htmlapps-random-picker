const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture, html } = require('./app-harness.cjs');

// Bind the actual template's translation attributes to the existing DOM boundary.
// The real setLanguage and click listeners provide all translated values.
function headerFixture() {
  const app = fixture();
  const translated = [];
  for (const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
    const id = match[2].match(/\bid="([^"]+)"/)?.[1];
    if (!match[2].includes('data-i18n') && id !== 'languageButton') continue;
    const element = id ? app.get('#' + id) : new app.Element(match[1]);
    for (const attr of match[2].matchAll(/([\w-]+)="([^"]*)"/g)) {
      element.setAttribute(attr[1], attr[2]);
      if (attr[1] === 'title') element.title = attr[2];
      if (attr[1].startsWith('data-')) element.dataset[attr[1].slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = attr[2];
    }
    translated.push(element);
  }
  const query = app.document.querySelectorAll;
  app.document.querySelectorAll = selector => {
    const attribute = selector.match(/^\[(data-i18n[\w-]*)\]$/)?.[1];
    return attribute ? translated.filter(element => element.getAttribute(attribute) !== null) : query(selector);
  };
  return app;
}

for (const [language, text, target] of [['en', 'JA', 'Switch to Japanese'], ['ja', 'EN', '英語に切り替え']]) {
  test(`${language} language control names its target in aria and title`, () => {
    const app = headerFixture();
    app.api.setLanguage(language);
    const button = app.get('#languageButton');
    assert.equal(button.textContent, text);
    assert.equal(button.getAttribute('aria-label'), target);
    assert.equal(button.title, target);
    assert.equal(app.document.documentElement.lang, language);
  });
  test(`${language} Help and Close retain localized accessible names and titles`, () => {
    const app = headerFixture();
    app.api.setLanguage(language);
    for (const [id, expected] of [['helpButton', language === 'ja' ? '使い方と注意事項' : 'How to use & notes'], ['helpCloseButton', language === 'ja' ? '閉じる' : 'Close']]) {
      assert.equal(app.get('#' + id).getAttribute('aria-label'), expected);
      assert.equal(app.get('#' + id).title, expected);
    }
  });
}

test('repeated language clicks persist the language and preserve the active candidate source', () => {
  const app = headerFixture();
  app.api.state.source = 'Alice\n\n同じ\n同じ';
  app.api.setLanguage('ja');
  for (const language of ['en', 'ja', 'en', 'ja']) {
    app.get('#languageButton').dispatch('click');
    assert.equal(app.api.state.language, language);
    assert.equal(app.get('#languageButton').textContent, language === 'ja' ? 'EN' : 'JA');
    assert.equal(app.stored.get('htmlapps-random-picker:language'), language);
    assert.equal(app.api.state.source, 'Alice\n\n同じ\n同じ');
  }
  app.get('#helpButton').dispatch('click');
  assert.equal(app.get('#helpDialog').open, true);
  app.get('#helpCloseButton').dispatch('click');
  assert.equal(app.get('#helpDialog').open, false);
});
