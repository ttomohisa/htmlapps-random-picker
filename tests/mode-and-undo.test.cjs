'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {fixture,plain}=require('./app-harness.cjs');

test('Pick disables impossible requested counts before drawing',()=>{
  const f=fixture();
  f.api.state.source='A\nB';
  f.api.state.pickCount=3;
  f.api.updateCandidateStats();
  assert.equal(f.api.modeError(),'notEnough');
  assert.equal(f.get('#runButton').disabled,true);
  f.api.runCurrentMode();
  assert.equal(f.api.state.result,null);
  f.api.state.pickCount=2;
  f.api.updateCandidateStats();
  assert.equal(f.get('#runButton').disabled,false);
});

test('Pick checks remaining pool and updateCandidateStats follows exclusions',()=>{
  const f=fixture();
  f.api.state.source='A\nB\nC';
  f.api.state.pickCount=2;
  f.api.state.excluded=new Set([0,1]);
  f.api.updateCandidateStats();
  assert.equal(f.api.modeError(),'notEnough');
  assert.equal(f.get('#runButton').disabled,true);
  f.api.state.excluded.clear();
  f.api.updateCandidateStats();
  assert.equal(f.api.modeError(),null);
});

test('Teams rejects insufficient members or a split over 50 teams',()=>{
  const f=fixture();
  f.api.state.mode='teams';
  f.api.state.source='Only';
  assert.equal(f.api.modeError(),'teamNotEnough');
  f.api.state.teamSplit='size';
  assert.equal(f.api.modeError(),null,'one candidate can fill a size-based group');
  f.api.state.teamSplit='count';
  f.api.state.source='A\nB';
  f.api.state.teamCount=3;
  assert.equal(f.api.modeError(),'teamMoreThanMembers');
  f.api.state.teamCount=2;
  assert.equal(f.api.modeError(),null);
  f.api.state.source=Array.from({length:51},(_,i)=>'Candidate '+i).join('\n');
  f.api.state.teamSplit='size';
  f.api.state.teamSize=1;
  assert.equal(f.api.modeError(),'teamTooMany');
  f.api.state.teamSize=2;
  assert.equal(f.api.modeError(),null);
});

test('Wheel above 200 is invalid before any random draw',()=>{
  const f=fixture();
  f.api.state.mode='wheel';
  f.api.state.source=Array.from({length:201},(_,i)=>'Candidate '+i).join('\n');
  f.api.updateCandidateStats();
  assert.equal(f.api.modeError(),'wheelLimit');
  assert.equal(f.get('#runButton').disabled,true);
  f.api.runCurrentMode();
  assert.equal(f.api.state.result,null);
  assert.equal(f.api.state.history.length,0);
});

test('Whitespace-only source never enables Sample until cleared',()=>{
  const f=fixture();
  f.api.state.source='  \n ';
  f.api.updateCandidateStats();
  assert.equal(f.get('#sampleButton').disabled,true);
  f.api.setSource('');
  assert.equal(f.get('#sampleButton').disabled,false);
});

test('Cleanup Undo restores list, excluded rows, draw history, and result',()=>{
  const f=fixture();
  const history=[{time:1234,values:['B'],mode:'pick'}];
  const result={type:'pick',values:['B'],at:1234};
  f.api.state.source=' A \nB';
  f.api.state.excluded=new Set([1]);
  f.api.state.history=plain(history);
  f.api.state.result=plain(result);
  f.get('#trimButton').dispatch('click');
  assert.equal(f.api.state.source,'A\nB');
  assert.equal(f.api.state.history.length,0);
  f.get('#appToastAction').dispatch('click');
  assert.equal(f.api.state.source,' A \nB');
  assert.deepEqual([...f.api.state.excluded],[1]);
  assert.deepEqual(plain(f.api.state.history),history);
  assert.deepEqual(plain(f.api.state.result),result);
});

test('Clear all Undo restores the complete previous session',async()=>{
  const f=fixture();
  const previous={source:'Alice\nBob',history:[{time:100,values:['Alice'],mode:'pick'}],result:{type:'pick',values:['Alice'],at:100}};
  f.api.state.source=previous.source;
  f.api.state.excluded=new Set([0]);
  f.api.state.history=plain(previous.history);
  f.api.state.result=plain(previous.result);
  f.get('#clearButton').dispatch('click');
  f.get('#appConfirmOk').dispatch('click');
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(f.api.state.source,'');
  f.get('#appToastAction').dispatch('click');
  assert.equal(f.api.state.source,previous.source);
  assert.deepEqual([...f.api.state.excluded],[0]);
  assert.deepEqual(plain(f.api.state.history),previous.history);
  assert.deepEqual(plain(f.api.state.result),previous.result);
});
