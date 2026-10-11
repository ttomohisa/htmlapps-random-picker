const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const removed = [
  "ダイアログを開いている間は背景をスクロールせず、長い内容はダイアログ内でスクロールできます。閉じると通常のページスクロールに戻ります。",
  "While a dialog is open, the background stays still and long content scrolls inside the dialog. Closing it restores normal page scrolling."
];
for (const file of ["src/index.template.html", "random-picker.html"]) {
  test(`${file}: user help omits implementation commentary`, () => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const text of removed) assert.ok(!html.includes(text), `Remove implementation copy from ${file}`);
  });
}
