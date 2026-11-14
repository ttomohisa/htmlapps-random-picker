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
  assert.doesNotMatch(workflow,/\$tag:(?=\s|[^a-zA-Z_])/,'an unbraced variable before a colon is a PowerShell parser error');
  assert.match(workflow,/Refusing to reuse \$\{tag\}:/);
});

test('Every release PowerShell script parses on Windows',()=>{
  if (process.platform !== 'win32') return;
  const {spawnSync} = require('node:child_process');
  const lines=workflow.replace(/\r\n/g,'\n').split('\n');
  const scripts=[];
  for(let i=0;i<lines.length;i++) {
    if(lines[i] !== '        run: |') continue;
    const parts=[];
    for(let j=i+1;j<lines.length;j++){
      const line=lines[j];
      if (line.trim() === '') {parts.push('');continue;}
      if (!line.startsWith('          ')) break;
      parts.push(line.slice(10));
    }
    scripts.push(parts.join('\n'));
  }
  assert.ok(scripts.length >= 3,'all release PowerShell scripts extracted');
  const parse=[
    '$source=[Console]::In.ReadToEnd()',
    '$tokens=$null',
    '$errors=$null',
    '[System.Management.Automation.Language.Parser]::ParseInput($source,[ref]$tokens,[ref]$errors) | Out-Null',
    'if ($errors.Count -gt 0) {',
    '  $errors | ForEach-Object { [Console]::Error.WriteLine($_.Message) }',
    '  exit 1',
    '}'
  ].join('\n');
  for (const [index,script] of scripts.entries()) {
    const result=spawnSync('pwsh',['-NoLogo','-NoProfile','-NonInteractive','-Command',parse],{
      input:script,encoding:'utf8',timeout:10000
    });
    assert.equal(result.status,0,'Release PowerShell step '+(index+1)+' does not parse: '+(result.stderr||result.error));
  }
});

test('Release tags use SemVer, are never moved, and publishing is idempotent',()=>{
  assert.match(config.version,/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.match(workflow,/\$tag = "v\$version"/);
  assert.match(workflow,/git tag --list \$tag/);
  assert.match(workflow,/tagCommit -ne \$commit/);
  assert.match(workflow,/Invoke-WebRequest[^\n]+-SkipHttpErrorCheck/);
  assert.match(workflow,/if \(\$releaseStatus -eq 200\) \{ \$alreadyReleased = \$true \}/);
  assert.match(workflow,/elseif \(\$releaseStatus -eq 404\) \{ \$alreadyReleased = \$false \}/);
  assert.match(workflow,/else \{ throw "Unable to check GitHub Release status/);
  assert.doesNotMatch(workflow,/gh release view/,'missing release must not fail native command');
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
