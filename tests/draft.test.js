import test from 'node:test';
import assert from 'node:assert/strict';
import { initialDraft, getDraftMoves, applyDraftMove, draftMoveKey } from '../src/draft.js';

test('initial draft position has 12 pieces per side and 7 legal moves each',()=>{
 const s=initialDraft();assert.equal(s.board.filter(p=>p?.side==='w').length,12);assert.equal(s.board.filter(p=>p?.side==='b').length,12);assert.equal(getDraftMoves(s,'w').length,7);assert.equal(getDraftMoves(s,'b').length,7);
});
test('men move forward only and turns alternate',()=>{
 const s=initialDraft(),moves=getDraftMoves(s);assert.ok(moves.every(m=>Math.floor(m.path[0]/8)<Math.floor(m.from/8)));const next=applyDraftMove(s,moves[0]);assert.equal(next.turn,'b');assert.equal(next.board.filter(Boolean).length,24);
});
test('mandatory capture suppresses ordinary moves',()=>{
 const s=initialDraft();s.board=Array(64).fill(null);s.board[4*8+1]={side:'w',king:false};s.board[3*8+2]={side:'b',king:false};s.board[7*8+6]={side:'b',king:false};s.turn='w';const moves=getDraftMoves(s);assert.equal(moves.length,1);assert.deepEqual(moves[0].captures,[3*8+2]);assert.equal(moves[0].path[0],2*8+3);
});
test('flying king can capture and land beyond a piece',()=>{
 const s=initialDraft();s.board=Array(64).fill(null);s.board[5*8+0]={side:'w',king:true};s.board[3*8+2]={side:'b',king:false};s.board[0]={side:'b',king:false};s.turn='w';const moves=getDraftMoves(s);assert.ok(moves.some(m=>m.from===40&&m.captures.includes(26)&&m.path[0]===19));assert.ok(moves.every(m=>m.captures.length>0));
});
test('move key captures full multi-jump path',()=>{assert.equal(draftMoveKey({from:40,path:[26,8]}),'40:26,8');});

test('men may capture backwards while ordinary movement remains forward-only',()=>{
 const s=initialDraft();s.board=Array(64).fill(null);s.board[3*8+3]={side:'w',king:false};s.board[4*8+4]={side:'b',king:false};s.board[7*8+0]={side:'b',king:false};s.turn='w';const moves=getDraftMoves(s);assert.ok(moves.some(m=>m.from===27&&m.path[0]===45&&m.captures.includes(36)));
});
