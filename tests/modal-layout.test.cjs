const test = require('node:test');
const assert = require('node:assert/strict');
const { html } = require('./app-harness.cjs');

const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];

// Structural regression only: real outside-wheel behavior and native close paths
// still require browser QA. :modal releases the lock on every native close path.
for (const element of ['html', 'body']) {
  test(`${element} locks background scrolling only while a native modal is active`, () => {
    const selector = `${element}:has(dialog:modal)`;
    const rule = rules.find(([, selectors]) => selectors.split(',').some(value => value.trim() === selector));
    assert.ok(rule, `${selector} must follow the native modal state`);
    assert.match(rule[2], /(?:^|;)\s*overflow\s*:\s*hidden\s*(?:;|$)/,
      'both scroll axes must stay locked behind the dialog');
  });
}
