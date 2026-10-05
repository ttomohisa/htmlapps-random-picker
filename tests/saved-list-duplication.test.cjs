const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture, list, plain, key } = require('./app-harness.cjs');

function ready(names = ['Alpha', 'Beta']) {
  const f = fixture();
  f.api.state.savedLists = names.map((name, index) => list('id-' + index, name, `  Red ${index}\r\n\r\n青 ${index}\nRed ${index}\n`));
  f.stored.set(key, JSON.stringify(f.api.state.savedLists));
  Object.assign(f.api.state, {
    source: 'Current\nDraft', mode: 'pick', pickCount: 2, teamCount: 3, teamSize: 4,
    excludeSelected: true, history: [{ values: ['Draft'], time: 123 }],
    result: { type: 'pick', values: ['Draft'], at: 123 }
  });
  f.api.state.excluded.add(1);
  f.get('#candidateInput').value = f.api.state.source;
  f.get('#savedListsDialog').showModal(); f.api.renderSavedLists();
  return f;
}
const active = f => JSON.stringify({ ...f.api.state, savedLists: undefined, excluded: [...f.api.state.excluded] });
function duplicate(f, id = 'id-0') {
  assert.equal(typeof f.api.duplicateSavedList, 'function', 'saved-list duplication is available');
  return f.api.duplicateSavedList(id);
}
const names = f => Array.from(f.api.state.savedLists, item => item.name);

test('duplicate uses the chosen stored source exactly and never edits the active draw', () => {
  const f = ready(), before = active(f), original = plain(f.api.state.savedLists[1]);
  const storedBefore = f.stored.get(key);
  assert.equal(duplicate(f, 'id-1'), true);
  const copy = f.api.state.savedLists[0];
  assert.equal(copy.name, 'Beta (copy)'); assert.equal(copy.source, original.source);
  assert.notEqual(copy.id, original.id); assert.ok(copy.createdAt > original.createdAt);
  assert.equal(copy.updatedAt, copy.createdAt);
  assert.deepEqual(plain(f.api.state.savedLists.slice(1)), JSON.parse(storedBefore));
  assert.equal(active(f), before); assert.equal(f.get('#candidateInput').value, 'Current\nDraft');
  assert.equal(f.storageWrites.length, 1); assert.equal(f.storageWrites[0].key, key);
  assert.equal(f.stored.get(key), JSON.stringify(f.api.state.savedLists));
});

test('each saved row has a localized and named Duplicate button that copies its own list', () => {
  for (const language of ['en', 'ja']) {
    const f = ready(); f.api.state.language = language; f.api.renderSavedLists();
    const label = language === 'ja' ? '複製' : 'Duplicate';
    for (const row of f.get('#savedListItems').children) {
      const buttons = row.children[1].children;
      assert.ok(buttons.some(button => button.textContent === label));
    }
    const betaRow = f.get('#savedListItems').children[1];
    const button = betaRow.children[1].children.find(button => button.textContent === label);
    assert.equal(button.type, 'button'); assert.equal(button.getAttribute('aria-label'), `${label}: Beta`);
    button.dispatch('click');
    assert.equal(f.api.state.savedLists[0].name, language === 'ja' ? 'Beta（コピー）' : 'Beta (copy)');
    assert.equal(f.api.state.savedLists[0].source, f.api.state.savedLists.find(item => item.id === 'id-1').source);
  }
});

test('repeated duplication chooses unused localized names, ignoring name case and whitespace', () => {
  for (const [language, first, second, third] of [
    ['en', 'Alpha (copy)', 'Alpha (copy 2)', 'Alpha (copy 3)'],
    ['ja', 'Alpha（コピー）', 'Alpha（コピー 2）', 'Alpha（コピー 3）']
  ]) {
    const f = ready(['Alpha', ` ${first.toUpperCase()} `]); f.api.state.language = language;
    assert.equal(duplicate(f), true); assert.equal(names(f)[0], second);
    assert.equal(duplicate(f), true); assert.equal(names(f)[0], third);
    assert.equal(new Set(f.api.state.savedLists.map(item => item.id)).size, 4);
  }
});

test('copying a copy uses that row name and does not overwrite its original', () => {
  const f = ready(['Alpha']); duplicate(f); const firstCopy = plain(f.api.state.savedLists[0]);
  duplicate(f, firstCopy.id); assert.equal(names(f)[0], 'Alpha (copy) (copy)');
  assert.deepEqual(plain(f.api.state.savedLists[1]), firstCopy);
});

test('long Unicode names reserve complete suffixes within the 40-unit input limit', () => {
  for (const [language, suffix, nextSuffix] of [
    ['en', ' (copy)', ' (copy 2)'], ['ja', '（コピー）', '（コピー 2）']
  ]) {
    const base = '😀'.repeat(20), f = ready([base]); f.api.state.language = language;
    duplicate(f); const first = names(f)[0]; duplicate(f); const second = names(f)[0];
    assert.ok(first.endsWith(suffix)); assert.ok(second.endsWith(nextSuffix));
    for (const name of [first, second]) {
      assert.ok(name.length <= 40); assert.equal(Buffer.from(name).toString('utf8'), name);
      assert.ok(name.startsWith('😀')); assert.ok(!name.includes('�'));
    }
    assert.notEqual(first, second);
    const writes = f.storageWrites.length;
    f.api.beginRenameSavedList(f.api.state.savedLists[0].id); f.keydown(f.get('#renameListName'));
    assert.equal(names(f)[0], second); assert.equal(f.storageWrites.length, writes);
  }
});

test('truncation collisions across different long names still get unique copy names', () => {
  const f = ready(['A'.repeat(39) + '1', 'A'.repeat(39) + '2']);
  duplicate(f); duplicate(f, 'id-1');
  assert.equal(names(f)[0], 'A'.repeat(31) + ' (copy 2)');
  assert.equal(names(f)[1], 'A'.repeat(33) + ' (copy)');
});

test('successful duplication reveals the copy, focuses Undo and survives reopen and reload', () => {
  const f = ready(), before = f.stored.get(key);
  f.get('#savedListSearch').value = 'Alpha'; f.get('#savedListSearch').dispatch('input');
  duplicate(f);
  assert.equal(f.get('#savedListSearch').value, ''); assert.equal(f.get('#savedListItems').children.length, 3);
  assert.match(f.get('#savedListStatusMessage').textContent, /Alpha \(copy\)/);
  assert.equal(f.document.activeElement, f.get('#savedListUndoButton'));
  assert.equal(f.get('#savedListUndoButton').hidden, false);
  assert.equal(f.get('#savedListsDialog').open, true);
  f.get('#savedListsDialog').close(); f.get('#savedListsButton').dispatch('click');
  assert.equal(f.get('#savedListUndoButton').hidden, false);
  const reloaded = fixture({ stored: f.stored }); reloaded.api.loadSavedLists();
  assert.deepEqual(plain(reloaded.api.state.savedLists), plain(f.api.state.savedLists));
  f.get('#savedListUndoButton').dispatch('click'); assert.equal(f.stored.get(key), before);
});

test('the 30th copy is accepted and a 31st preserves storage, search and previous Undo', () => {
  const f = ready(Array.from({ length: 29 }, (_, i) => 'List ' + i)), before = f.stored.get(key);
  duplicate(f); assert.equal(f.api.state.savedLists.length, 30);
  const after = f.stored.get(key); f.get('#savedListSearch').value = 'List 0';
  assert.equal(duplicate(f), false); assert.equal(f.stored.get(key), after);
  assert.equal(JSON.stringify(f.api.state.savedLists), after);
  assert.equal(f.get('#savedListSearch').value, 'List 0'); assert.match(f.get('#savedListStatusMessage').textContent, /30/);
  assert.equal(f.storageWrites.length, 1);
  f.get('#savedListUndoButton').dispatch('click'); assert.equal(f.stored.get(key), before);
});

test('failed copy leaves data, prior deletion Undo, search and editor intact', () => {
  const f = ready(), before = f.stored.get(key); f.api.deleteSavedList('id-1');
  f.api.beginRenameSavedList('id-0'); f.get('#renameListName').value = 'Unsaved name';
  f.get('#savedListSearch').value = 'Alpha'; const afterDelete = f.stored.get(key);
  f.rejectStorage(true); assert.equal(duplicate(f), false);
  assert.equal(f.stored.get(key), afterDelete); assert.equal(JSON.stringify(f.api.state.savedLists), afterDelete);
  assert.equal(f.get('#savedListSearch').value, 'Alpha'); assert.equal(f.get('#savedListRenamePanel').hidden, false);
  assert.equal(f.get('#renameListName').value, 'Unsaved name'); assert.equal(f.get('#savedListUndoButton').hidden, false);
  assert.match(f.get('#savedListStatusMessage').textContent, /could not/i);
  f.rejectStorage(false); f.get('#savedListUndoButton').dispatch('click'); assert.equal(f.stored.get(key), before);
});

test('failed duplicate Undo is retryable without removing a stored copy early', () => {
  const f = ready(), before = f.stored.get(key); duplicate(f); const after = f.stored.get(key);
  f.rejectStorage(true); f.get('#savedListUndoButton').dispatch('click');
  assert.equal(f.stored.get(key), after); assert.equal(JSON.stringify(f.api.state.savedLists), after);
  assert.equal(f.get('#savedListUndoButton').hidden, false);
  f.rejectStorage(false); f.get('#savedListUndoButton').dispatch('click'); assert.equal(f.stored.get(key), before);
});

test('missing duplicate target makes no storage or active-state changes', () => {
  const f = ready(), before = f.stored.get(key), draw = active(f);
  assert.equal(duplicate(f, 'missing'), false); assert.equal(f.stored.get(key), before);
  assert.equal(f.storageWrites.length, 0); assert.equal(active(f), draw);
});

for (const name of ['Alpha', '  Alpha  ']) test(`unchanged rename ${JSON.stringify(name)} keeps deletion Undo and timestamps`, () => {
  const f = ready(), before = f.stored.get(key), draw = active(f); f.api.deleteSavedList('id-1');
  const afterDelete = f.stored.get(key), writes = f.storageWrites.length, message = f.get('#savedListStatusMessage').textContent;
  f.api.beginRenameSavedList('id-0'); f.get('#renameListName').value = name; f.keydown(f.get('#renameListName'));
  assert.equal(f.storageWrites.length, writes); assert.equal(f.stored.get(key), afterDelete);
  assert.equal(JSON.stringify(f.api.state.savedLists), afterDelete); assert.equal(active(f), draw);
  assert.equal(f.get('#savedListRenamePanel').hidden, true);
  assert.equal(f.get('#savedListStatusMessage').textContent, message);
  assert.equal(f.document.activeElement, f.get('#savedListSearch'));
  f.get('#savedListUndoButton').dispatch('click'); assert.equal(f.stored.get(key), before);
});

test('unchanged rename closes without writing even when storage is unavailable', () => {
  const f = ready(), before = f.stored.get(key); f.rejectStorage(true); f.api.beginRenameSavedList('id-0');
  assert.equal(f.api.renameSavedList('id-0', 'Alpha'), true);
  assert.equal(f.storageWrites.length, 0); assert.equal(f.get('#savedListRenamePanel').hidden, true);
  assert.equal(f.stored.get(key), before);
});

test('a genuine case-only rename still updates its timestamp and has its own Undo', () => {
  const f = ready(); f.api.deleteSavedList('id-1'); const before = f.stored.get(key);
  assert.equal(f.api.renameSavedList('id-0', 'ALPHA'), true);
  assert.equal(f.api.state.savedLists[0].name, 'ALPHA'); assert.ok(f.api.state.savedLists[0].updatedAt > 2);
  assert.equal(f.storageWrites.length, 2);
  f.get('#savedListUndoButton').dispatch('click'); assert.equal(f.stored.get(key), before);
  assert.equal(f.api.state.savedLists.length, 1);
});

for (const action of ['replacement', 'duplicate']) test(`unchanged rename also retains prior ${action} Undo`, () => {
  const f = ready(), before = f.stored.get(key);
  if (action === 'replacement') {
    f.get('#savedListName').value = 'Alpha'; f.api.saveNamedList();
    f.get('#confirmSavedListUpdateButton').dispatch('click');
  } else duplicate(f);
  const writes = f.storageWrites.length;
  f.api.beginRenameSavedList('id-0'); f.get('#renameListName').value = ' Alpha '; f.keydown(f.get('#renameListName'));
  assert.equal(f.storageWrites.length, writes);
  f.get('#savedListUndoButton').dispatch('click'); assert.equal(f.stored.get(key), before);
});

test('successful duplication dismisses stale rename and replacement actions', () => {
  for (const editor of ['rename', 'replacement']) {
    const f = ready();
    if (editor === 'rename') { f.api.beginRenameSavedList('id-1'); f.get('#renameListName').value = 'Ignored'; }
    else { f.get('#savedListName').value = 'Beta'; f.api.saveNamedList(); }
    duplicate(f); const after = f.stored.get(key);
    assert.equal(f.get('#savedListRenamePanel').hidden, true); assert.equal(f.get('#savedListUpdatePanel').hidden, true);
    f.get('#renameListButton').dispatch('click'); f.get('#confirmSavedListUpdateButton').dispatch('click');
    assert.equal(f.stored.get(key), after);
  }
});

test('copied names are text and success feedback changes language without changing saved names', () => {
  const f = ready(['<b>Alpha</b>']); duplicate(f);
  assert.equal(f.get('#savedListItems').children[0].children[0].children[0].textContent, '<b>Alpha</b> (copy)');
  const after = f.stored.get(key); f.api.setLanguage('ja');
  assert.match(f.get('#savedListStatusMessage').textContent, /複製/);
  assert.match(f.get('#savedListStatusMessage').textContent, /<b>Alpha<\/b> \(copy\)/);
  assert.equal(f.stored.get(key), after); assert.equal(f.get('#savedListUndoButton').hidden, false);
});
