'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

for (const file of ['src/index.template.html','random-picker.html']) {
  const html = fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  test(`${file}: removed Show commentary is absent from Help in JA and EN`,()=>{
    assert.doesNotMatch(html, /data-i18n="helpNoteShow"/);
    assert.doesNotMatch(html, /helpNoteShow:/);
  });
  test(`${file}: Pick buttons show a recognizable five-pip die instead of shuffle arrows`,()=>{
    const button=html.match(/<button class="mode-button"[^>]*data-mode="pick"[^>]*>[\s\S]*?<\/button>/)?.[0];
    assert.ok(button, 'Pick tab exists');
    assert.match(button, /<rect x="3\.5" y="3\.5" width="17" height="17"/);
    assert.equal((button.match(/<circle /g)||[]).length,5,'five visible pips');
    assert.doesNotMatch(button,/M5 7h4l7 10h3/);
  });
  test(`${file}: Show stage has a curtain, reveal, and reduced-motion fallbacks`,()=>{
    for (const item of ['id="deluxeCurtain"','id="deluxeCurtainText"','class="deluxe-flash"','show-marquee','show-result','prefers-reduced-motion: reduce']) assert.ok(html.includes(item),item);
    assert.match(html, /dialog\.classList\.add\('suspense'\)/);
    assert.match(html, /setTimeout\(finishSpin,720\)/);
  });
}
