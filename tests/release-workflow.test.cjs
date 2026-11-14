'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflow=fs.readFileSync(path.join(__dirname,'..','.github','workflows','release-on-merge.yml'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'..','app.config.json'),'utf8'));

test('Release is triggered by merging a PR into main, not by closing without merge',()=>{
  assert.match(workflow,/\bon:\s*\n\s+pull_request:\s*\n\s+branches: \[main\]\s*\n\s+types: \[closed\]/);
  assert.match(workflow,/if: github\.event\.pull_request\.merged == true/);
  assert.doesNotMatch(workflow,/\bworkflow_dispatch\s*:/);
  assert.match(workflow,/ref: \$\{\{ github\.event\.pull_request\.merge_commit_sha \}\}/);
  assert.match(workflow,/persist-credentials: false/);
});

test('Release PowerShell uses braced variable syntax when colon follows the tag name',()=>{
  assert.doesNotMatch(workflow,/\\$tag:(?=\\s|[^a-zA-Z_])/,'an unbraced variable before a colon is a PowerShell parser error');
  assert.match(workflow,/Refusing to reuse \\$\\{tag\\}:/);
});

test('Release tags use SemVer, are never moved, and publishing is idempotent',()=>{
  assert.match(config.version,/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.match(workflow,/\$tag = "v\$version"/);
  assert.match(workflow,/git tag --list \$tag/);
  assert.match(workflow,/tagCommit -ne \$commit/);
  assert.match(workflow,/gh release view \$tag/);
  assert.match(workflow,/skip=\$\(\$alreadyReleased\.ToString\(\)\.ToLowerInvariant\(\)\)/);
  assert.doesNotMatch(workflow,/git\s+push\s+.*--force|gh\s+release\s+delete|git\s+tag\s+-f/i);
});

test('Release runs tests and checks before attaching two single-HTML files',()=>{
  assert.match(workflow,/contents: write/);
  const checks=workflow.indexOf('Run application regression tests');
  const build=workflow.indexOf('Build and verify both single-HTML variants');
  const publish=workflow.indexOf('Publish version tag and GitHub Release');
  assert.ok(checks >= 0 && checks < build && build < publish);
  assert.match(workflow,/node --test tests\/\*\.test\.cjs/);
  assert.match(workflow,/scripts\/check-repository\.ps1/);
  assert.match(workflow,/dist\/index\.html/);
  assert.match(workflow,/dist\/index\.self-extract\.html/);
  assert.match(workflow,/random-picker\.html/);
  assert.match(workflow,/random-picker-self-extract\.html/);
  assert.match(workflow,/gh release create/);
  assert.match(workflow,/--target \$env:COMMIT/);
  assert.match(workflow,/--generate-notes/);
});
