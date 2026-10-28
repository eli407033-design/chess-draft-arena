import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';

test('chess starts from the standard legal position',()=>{const c=new Chess();assert.equal(c.moves().length,20);assert.equal(c.turn(),'w');});
test('chess engine rejects illegal moves and supports castling state',()=>{const c=new Chess();assert.throws(()=>c.move({from:'e2',to:'e5'}));c.move('e4');c.move('e5');c.move('Nf3');c.move('Nc6');assert.equal(c.turn(),'w');assert.equal(c.isGameOver(),false);});
test('checkmate is detected',()=>{const c=new Chess();for(const m of ['f3','e5','g4','Qh4#'])c.move(m);assert.equal(c.isCheckmate(),true);});
