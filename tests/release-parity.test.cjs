const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('checked-in standalone release matches the current template apart from build metadata', () => {
  const read = relative => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  const normalize = html => html.replace(/\r\n/g, '\n')
    .replace(/^      const (APP_CONFIG|BUILD_MANIFEST|assetBundle) = .*;$/gm, '      const $1 = BUILD_VALUE;');
  assert.equal(normalize(read('random-picker.html')), normalize(read('src/index.template.html')));
});
