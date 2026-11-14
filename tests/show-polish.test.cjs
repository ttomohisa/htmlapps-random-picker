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
    assert.match(html, /wheelStyleDeluxe: 'ドパガキ'/);
    assert.match(html, /wheelStyleDeluxe: 'Dopa-Gaki'/);
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

const {fixture} = require('./app-harness.cjs');
test('The stop angle may land anywhere inside the preselected segment, not just its center',()=>{
  const f=fixture();
  for (const count of [1,2,3,7,50,200]) {
    const sector=360/count;
    for (const selectedIndex of [0,Math.floor(count/2),count-1]) {
      for (const roll of [0,1200,4200,7200,8400]) {
        const angle=f.api.wheelStopAngle(selectedIndex,count,roll);
        assert.ok(angle>selectedIndex*sector+sector*.079,
          `stop too near start: count=${count} index=${selectedIndex}`);
        assert.ok(angle<(selectedIndex+1)*sector-sector*.079,
          `stop too near end: count=${count} index=${selectedIndex}`);
        const actualIndex=Math.floor((angle%360)/sector);
        assert.equal(actualIndex,selectedIndex,'pointer indicates the selected segment');
      }
    }
  }
  assert.notEqual(f.api.wheelStopAngle(0,5,0),f.api.wheelStopAngle(0,5,8400),
    'different randomness changes the stopping point');
});
