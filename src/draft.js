// 8x8 draughts engine: men move/capture forward; flying kings move/capture diagonally.
// Captures are compulsory. If multiple capture sequences exist, any complete sequence is legal.
export const SIZE = 8;
export const initialDraft = () => {
  const b = Array(64).fill(null);
  for (let r=0;r<3;r++) for(let c=0;c<8;c++) if((r+c)%2===1)b[r*8+c]={side:'b',king:false};
  for (let r=5;r<8;r++) for(let c=0;c<8;c++) if((r+c)%2===1)b[r*8+c]={side:'w',king:false};
  return {board:b,turn:'w',lastMove:null,history:[],winner:null};
};
const rc = i => [Math.floor(i/8),i%8];
const idx = (r,c) => r*8+c;
const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const dirs=[[-1,-1],[-1,1],[1,-1],[1,1]];
function capturesFrom(board,from,piece,visited=new Set()) {
  const [r,c]=rc(from), results=[];
  for(const [dr,dc] of dirs){
    if(piece.king){
      let rr=r+dr,cc=c+dc;
      while(inside(rr,cc)&&!board[idx(rr,cc)]){rr+=dr;cc+=dc;}
      if(!inside(rr,cc))continue;
      const victim=idx(rr,cc);
      if(board[victim].side===piece.side)continue;
      rr+=dr;cc+=dc;
      while(inside(rr,cc)&&!board[idx(rr,cc)]){
        if(!visited.has(victim)){
          const b=board.slice();b[from]=null;b[victim]=null;b[idx(rr,cc)]={...piece};
          const nextVisited=new Set(visited);nextVisited.add(victim);
          const tails=capturesFrom(b,idx(rr,cc),piece,nextVisited);
          if(tails.length)for(const t of tails)results.push({from,path:[idx(rr,cc),...t.path],captures:[victim,...t.captures]});
          else results.push({from,path:[idx(rr,cc)],captures:[victim]});
        }
        rr+=dr;cc+=dc;
      }
    } else {
      const mr=r+dr,mc=c+dc,lr=r+2*dr,lc=c+2*dc;
      if(!inside(lr,lc)||!inside(mr,mc))continue;
      const victim=idx(mr,mc),land=idx(lr,lc);
      if(board[victim]&&board[victim].side!==piece.side&&!board[land]&&!visited.has(victim)){
        const b=board.slice();b[from]=null;b[victim]=null;
        const crowned=(piece.side==='w'&&lr===0)||(piece.side==='b'&&lr===7);
        const moved={...piece,king:piece.king||crowned};b[land]=moved;
        const nv=new Set(visited);nv.add(victim);
        const tails=capturesFrom(b,land,moved,nv);
        if(tails.length)for(const t of tails)results.push({from,path:[land,...t.path],captures:[victim,...t.captures]});
        else results.push({from,path:[land],captures:[victim]});
      }
    }
  }
  return results;
}
export function getDraftMoves(state, side=state.turn) {
  const board=state.board, captures=[];
  board.forEach((p,from)=>{if(p&&p.side===side)captures.push(...capturesFrom(board,from,p));});
  if(captures.length)return captures;
  const moves=[];
  board.forEach((p,from)=>{
    if(!p||p.side!==side)return;
    const [r,c]=rc(from);
    for(const [dr,dc] of dirs){
      if(!p.king&&dr!==(side==='w'?-1:1))continue;
      if(p.king){let rr=r+dr,cc=c+dc;while(inside(rr,cc)&&!board[idx(rr,cc)]){moves.push({from,path:[idx(rr,cc)],captures:[]});rr+=dr;cc+=dc;}}
      else {const rr=r+dr,cc=c+dc;if(inside(rr,cc)&&!board[idx(rr,cc)])moves.push({from,path:[idx(rr,cc)],captures:[]});}
    }
  });
  return moves;
}
export function applyDraftMove(state,move){
  const board=state.board.slice(),piece={...board[move.from]};
  board[move.from]=null;
  for(const cap of move.captures||[])board[cap]=null;
  const to=move.path[move.path.length-1], [r]=rc(to);
  if((piece.side==='w'&&r===0)||(piece.side==='b'&&r===7))piece.king=true;
  board[to]=piece;
  const next=piece.side==='w'?'b':'w';
  const nextState={board,turn:next,lastMove:{from:move.from,path:[...move.path],captures:[...(move.captures||[])]},history:[...(state.history||[]),{from:move.from,path:[...move.path],captures:[...(move.captures||[])]}],winner:null};
  const remaining=board.filter(p=>p&&p.side===next).length;
  if(!remaining||getDraftMoves(nextState,next).length===0)nextState.winner=piece.side;
  return nextState;
}
export function draftMoveKey(m){return `${m.from}:${m.path.join(',')}`;}
export function draftStatus(state){if(state.winner)return state.winner==='w'?'White wins':'Black wins';return `${state.turn==='w'?'White':'Black'} to move${getDraftMoves(state).some(m=>m.captures.length)?' · Capture required':''}`;}
export function evaluateDraft(state,side){
  return state.board.reduce((sum,p,i)=>{if(!p)return sum;const [r,c]=rc(i);let v=p.king?175:100+(p.side==='w'?(7-r):r)*2; if(!p.king&&((p.side==='w'&&r===0)||(p.side==='b'&&r===7)))v+=0;return sum+(p.side===side?v:-v);},0);
}
export function chooseDraftMove(state,depth=3){
  const side=state.turn, moves=getDraftMoves(state);if(!moves.length)return null;
  const search=(s,d,a,b,maximizing)=>{const ms=getDraftMoves(s);if(s.winner)return s.winner===side?100000+d:-100000-d;if(!ms.length)return s.turn===side?-100000:100000;if(d===0)return evaluateDraft(s,side);
    let best=maximizing?-Infinity:Infinity;
    for(const m of ms){const val=search(applyDraftMove(s,m),d-1,a,b,!maximizing);if(maximizing){best=Math.max(best,val);a=Math.max(a,best);}else{best=Math.min(best,val);b=Math.min(b,best);}if(b<=a)break;}return best;};
  let best=-Infinity,choices=[];for(const m of moves){const score=search(applyDraftMove(state,m),depth-1,-Infinity,Infinity,false);if(score>best){best=score;choices=[m];}else if(score===best)choices.push(m);}return choices[Math.floor(Math.random()*choices.length)];
}
