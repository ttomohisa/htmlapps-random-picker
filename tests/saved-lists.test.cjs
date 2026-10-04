const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture, list, plain, html, key } = require('./app-harness.cjs');
function ready(count = 1) {
  const f = fixture(); f.api.state.savedLists = Array.from({length: count}, (_, i) => list('id-' + i, 'Class ' + i));
  f.stored.set(key, JSON.stringify(f.api.state.savedLists)); f.api.state.source = 'New\nCandidates'; f.get('#savedListsDialog').showModal(); return f;
}
function save(f, name) { f.get('#savedListName').value = name; f.api.saveNamedList(); }

test('31st named list preserves all existing lists and persisted bytes', () => {
  const f = ready(30), before = f.stored.get(key); save(f, 'New list');
  assert.equal(JSON.stringify(f.api.state.savedLists), before); assert.equal(f.stored.get(key), before);
  assert.match(f.get('#savedListStatusMessage').textContent, /30/);
});
test('30th list is accepted, survives reload, and shows capacity', () => {
  const f = ready(29); save(f, 'Last list'); assert.equal(f.api.state.savedLists.length, 30);
  f.api.loadSavedLists(); assert.equal(f.api.state.savedLists[0].name, 'Last list');
  assert.match(f.get('#savedListCount').textContent, /30\s*\/\s*30/);
});
test('failed save leaves memory and disk unchanged and reports storage failure', () => {
  const f = ready(); const before = f.stored.get(key); f.rejectStorage(true); save(f, 'New list');
  assert.equal(JSON.stringify(f.api.state.savedLists), before); assert.equal(f.stored.get(key), before);
  assert.equal(f.get('#savedListStatus').dataset.tone, 'warning'); assert.match(f.get('#savedListStatusMessage').textContent, /could not|couldn.t/i);
});
test('matching-name update requires explicit replacement and cancellation is lossless', () => {
  const f = ready(30), before = f.stored.get(key); save(f, 'cLASS 0');
  assert.equal(f.stored.get(key), before); assert.equal(JSON.stringify(f.api.state.savedLists), before);
  assert.equal(f.get('#savedListUpdatePanel').hidden, false); f.get('#cancelSavedListUpdateButton').dispatch('click');
  assert.equal(f.stored.get(key), before); assert.equal(f.get('#savedListUpdatePanel').hidden, true);
});
test('replacement at capacity preserves identity and creation time and supports modal Undo', () => {
  const f = ready(30), before = f.stored.get(key); save(f, 'cLASS 0'); f.get('#confirmSavedListUpdateButton').dispatch('click');
  assert.equal(f.api.state.savedLists.length, 30); assert.equal(f.api.state.savedLists[0].id, 'id-0'); assert.equal(f.api.state.savedLists[0].createdAt, 1);
  assert.equal(f.api.state.savedLists[0].source, 'New\nCandidates'); assert.equal(f.get('#savedListUndoButton').hidden, false);
  f.get('#savedListUndoButton').dispatch('click'); assert.equal(JSON.stringify(f.api.state.savedLists), before); assert.equal(f.stored.get(key), before);
});
test('failed replacement stays pending and can retry without changing original', () => {
  const f = ready(), before = f.stored.get(key); save(f, 'Class 0'); f.rejectStorage(true); f.get('#confirmSavedListUpdateButton').dispatch('click');
  assert.equal(JSON.stringify(f.api.state.savedLists), before); assert.equal(f.get('#savedListUpdatePanel').hidden, false);
  f.rejectStorage(false); f.get('#confirmSavedListUpdateButton').dispatch('click'); assert.equal(f.api.state.savedLists[0].source, 'New\nCandidates');
});
test('rename preserves source/id/createdAt, rejects blank and colliding names', () => {
  const f = ready(2); assert.equal(typeof f.api.renameSavedList, 'function');
  const before = plain(f.api.state.savedLists[0]);
  assert.equal(f.api.renameSavedList('id-0', '  '), false); assert.equal(f.api.renameSavedList('id-0', 'CLASS 1'), false);
  assert.equal(f.api.renameSavedList('id-0', ' New name '), true);
  const renamed = f.api.state.savedLists.find(item => item.id === 'id-0');
  assert.equal(renamed.name, 'New name'); for (const field of ['id', 'createdAt', 'source']) assert.equal(renamed[field], before[field]);
  f.api.loadSavedLists(); assert.equal(f.api.state.savedLists[0].name, 'New name');
});
test('cancel rename leaves saved data unchanged and restores a usable focus target', () => {
  const f = ready(), before = f.stored.get(key); assert.equal(typeof f.api.beginRenameSavedList, 'function');
  f.api.beginRenameSavedList('id-0'); f.get('#renameListName').value = 'Cancelled'; f.get('#cancelRenameListButton').dispatch('click');
  assert.equal(f.stored.get(key), before); assert.equal(f.get('#savedListRenamePanel').hidden, true);
  assert.ok(f.document.activeElement);
});
test('failed rename, delete, and Undo are transactional; failed Undo can retry', () => {
  const f = ready(), before = f.stored.get(key); assert.equal(typeof f.api.deleteSavedList, 'function');
  f.rejectStorage(true); assert.equal(f.api.renameSavedList('id-0', 'Nope'), false); f.api.deleteSavedList('id-0'); assert.equal(JSON.stringify(f.api.state.savedLists), before);
  f.rejectStorage(false); f.api.deleteSavedList('id-0'); assert.equal(f.api.state.savedLists.length, 0);
  f.rejectStorage(true); f.get('#savedListUndoButton').dispatch('click'); assert.equal(f.api.state.savedLists.length, 0); assert.equal(f.get('#savedListUndoButton').hidden, false);
  f.rejectStorage(false); f.get('#savedListUndoButton').dispatch('click'); assert.equal(f.stored.get(key), before);
});
test('search is trimmed case-insensitive name-only filter with matched/total and empty states', () => {
  const f = ready(2); f.api.state.savedLists[1].name = '日本語'; f.api.renderSavedLists();
  f.get('#savedListSearch').value = ' CLASS '; f.get('#savedListSearch').dispatch('input'); assert.equal(f.get('#savedListItems').children.length, 1);
  assert.match(f.get('#savedListCount').textContent, /1.*2.*30/);
  f.get('#savedListSearch').value = 'Alice'; f.get('#savedListSearch').dispatch('input'); assert.equal(f.get('#savedListItems').children.length, 0);
  assert.match(f.get('#savedListsEmpty').textContent, /match/i);
  f.get('#savedListSearch').value = '日本'; f.get('#savedListSearch').dispatch('input'); assert.equal(f.get('#savedListItems').children.length, 1);
  assert.equal(f.api.state.savedLists.length, 2);
});
test('saved list status and Undo are structurally inside active modal', () => {
  const modal = html.match(/<dialog id="savedListsDialog"[\s\S]*?<\/dialog>/)[0];
  assert.match(modal, /id="savedListStatus"[^>]*role="status"/); assert.match(modal, /id="savedListUndoButton"/);
});
for (const dialog of ['savedListsDialog', 'helpDialog', 'excelPasteDialog', 'appConfirmDialog', 'presentationDialog']) test(`global draw shortcut ignores ${dialog}`, () => {
  const f = fixture(); f.api.state.source = 'Alice\nBob'; f.get('#' + dialog).showModal();
  f.keydown(f.get('#savedListName'), { ctrlKey: true }); assert.equal(f.api.state.history.length, 0); assert.equal(f.api.state.excluded.size, 0);
});
test('global shortcut guards other editable fields, repeats, composition, and Alt', () => {
  for (const args of [{target:'#pickCount',ctrlKey:true},{target:'#candidateInput',ctrlKey:true,repeat:true},{target:'#candidateInput',ctrlKey:true,isComposing:true},{target:'#candidateInput',ctrlKey:true,altKey:true}]) {
    const f = fixture(); f.api.state.source = 'Alice\nBob'; const {target, ...event} = args; f.keydown(f.get(target), event); assert.equal(f.api.state.history.length, 0);
  }
});
test('intentional Ctrl/Cmd+Enter from main candidate input still draws once', () => {
  for (const modifier of ['ctrlKey','metaKey']) { const f = fixture(); f.api.state.source = 'Alice\nBob'; f.keydown(f.get('#candidateInput'), { [modifier]: true }); assert.equal(f.api.state.history.length, 1); }
});
test('save and rename Enter ignore IME composition, repeats, and modifiers', () => {
  for (const extra of [{isComposing:true},{repeat:true},{ctrlKey:true},{metaKey:true},{altKey:true},{shiftKey:true}]) {
    const f = ready(), before = f.stored.get(key); f.get('#savedListName').value = 'Ignore'; f.keydown(f.get('#savedListName'),extra); assert.equal(f.stored.get(key),before);
  }
});
test('translations cover identical keys and saved-list labels in JA/EN', () => {
  const f = ready(); assert.deepEqual(Object.keys(f.api.translations.ja).sort(), Object.keys(f.api.translations.en).sort());
  for (const lang of ['ja','en']) { f.api.state.language = lang; f.api.renderSavedLists(); assert.match(f.get('#savedListCount').textContent,/1.*30/); assert.ok(f.api.translations[lang].renameList); }
});
test('randomization keeps distinct duplicate rows, full order, and balanced teams', () => {
  const f = fixture(); f.api.state.source = 'Same\nSame\nThird\nFourth\nFifth';
  const candidates = f.api.parseCandidates().candidates; const picked = f.api.selectUnique(candidates, 5);
  assert.equal(new Set(picked.map(x => x.id)).size, 5); assert.equal(f.api.secureShuffle(candidates).length, 5);
  f.api.state.mode = 'teams'; f.api.state.teamCount = 2; f.api.runCurrentMode();
  assert.deepEqual(Array.from(f.api.state.result.teams, t => t.length), [3, 2]);
});
test('Teams preview follows source edits and saved-source replacement', () => {
  const f = fixture(); f.api.state.mode = 'teams'; f.api.setSource('A\nB'); assert.match(f.get('#teamSummary').textContent, /2 people/);
  f.api.setSource('A\nB\nC\nD'); assert.match(f.get('#teamSummary').textContent, /4 people/);
});
test('restoring exhausted pool refreshes Again and Undo refreshes it back', () => {
  const f = fixture(); f.api.state.source='A'; f.api.state.excludeSelected=true; f.api.runCurrentMode(); assert.equal(f.get('#againButton').disabled,true);
  f.get('#restorePoolButton').dispatch('click'); assert.equal(f.get('#againButton').disabled,false);
  f.get('#appToastAction').dispatch('click'); assert.equal(f.get('#againButton').disabled,true);
});
test('source edits invalidate old session Undo so excluded row IDs cannot leak', () => {
  const f = fixture(); f.api.state.source='A\nB'; f.api.state.excluded.add(0); f.get('#restorePoolButton').dispatch('click');
  f.get('#candidateInput').value='X\nY'; f.get('#candidateInput').dispatch('input'); assert.equal(f.get('#appToastAction').hidden,true); f.get('#appToastAction').dispatch('click'); assert.equal(f.api.state.excluded.size,0);
});
test('renaming Enter is IME-safe and plain Enter commits the name', () => {
  for (const extra of [{isComposing:true},{repeat:true},{ctrlKey:true},{metaKey:true},{altKey:true},{shiftKey:true}]) {
    const f = ready(), before = f.stored.get(key); f.api.beginRenameSavedList('id-0'); f.get('#renameListName').value = '日本語'; f.keydown(f.get('#renameListName'),extra); assert.equal(f.stored.get(key),before);
  }
  const f=ready(); f.api.beginRenameSavedList('id-0'); f.get('#renameListName').value='日本語'; f.keydown(f.get('#renameListName')); assert.equal(f.api.state.savedLists[0].name,'日本語');
});
test('dialog closing cancels pending replacement and rename; reopening preserves Undo', () => {
  const f=ready(), before=f.stored.get(key); save(f,'Class 0'); f.get('#savedListsDialog').close(); f.get('#confirmSavedListUpdateButton').dispatch('click'); assert.equal(f.stored.get(key),before);
  f.get('#savedListsButton').dispatch('click'); f.api.beginRenameSavedList('id-0'); f.get('#renameListName').value='Not saved'; f.get('#savedListsDialog').close(); assert.equal(f.stored.get(key),before);
  f.get('#savedListsButton').dispatch('click'); f.api.deleteSavedList('id-0'); f.get('#savedListsDialog').close(); f.get('#savedListsButton').dispatch('click'); f.get('#savedListUndoButton').dispatch('click'); assert.equal(f.stored.get(key),before);
});
test('new save replaces old Undo so deletion cannot restore a 31st list', () => {
  const f=ready(30); f.api.deleteSavedList('id-0'); save(f,'New name'); assert.equal(f.api.state.savedLists.length,30); f.get('#savedListUndoButton').dispatch('click'); assert.equal(f.api.state.savedLists.length,30); assert.equal(f.api.state.savedLists.some(x=>x.id==='id-0'),false);
});
test('empty source and blank names cannot persist; names are rendered as text', () => {
  const f=ready(), before=f.stored.get(key); save(f,'  '); assert.equal(f.stored.get(key),before); f.api.state.source=' \n '; save(f,'No candidates'); assert.equal(f.stored.get(key),before);
  f.api.state.source='Alice'; save(f,'<img src=x>日本語'); assert.equal(f.get('#savedListItems').children[0].children[0].children[0].textContent,'<img src=x>日本語');
});
test('retained saved-list feedback and Undo follow language when reopening', () => {
  const f=ready(); f.api.deleteSavedList('id-0'); f.get('#savedListsDialog').close(); f.api.state.language='ja'; f.get('#savedListsButton').dispatch('click');
  assert.match(f.get('#savedListStatusMessage').textContent,/削除/); assert.equal(f.get('#savedListUndoButton').hidden,false);
  f.get('#savedListUndoButton').dispatch('click'); f.get('#savedListsDialog').close(); f.api.state.language='en'; f.get('#savedListsButton').dispatch('click'); assert.equal(f.get('#savedListStatusMessage').textContent,'Restored');
});
