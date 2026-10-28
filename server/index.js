import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { randomBytes } from 'node:crypto';
import { Chess } from 'chess.js';
import { initialDraft, getDraftMoves, applyDraftMove, draftMoveKey } from '../src/draft.js';
const httpServer=createServer((req,res)=>{res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({service:'Chess & Draft Arena realtime server',status:'ok',rooms:rooms.size}));});
const io=new Server(httpServer,{cors:{origin:process.env.ALLOWED_ORIGIN||'*',methods:['GET','POST']},pingInterval:25000,pingTimeout:20000});
const rooms=new Map();
const makeCode=()=>randomBytes(3).toString('hex').toUpperCase();
function emitError(socket,message){socket.emit('online-error',{message});}
function syncRoom(room){return room.game==='chess'?{kind:'chess',fen:room.chess.fen()}:{kind:'draft',state:room.draft};}
io.on('connection',socket=>{
  socket.on('create-room',({game='chess',name='Guest Player'}={})=>{if(!['chess','draft'].includes(game))return emitError(socket,'Unknown game mode.');let roomId;do{roomId=makeCode();}while(rooms.has(roomId));const room={id:roomId,game,players:[{id:socket.id,name,side:'w',connected:true}],chess:new Chess(),draft:initialDraft(),createdAt:Date.now(),lastSeen:Date.now()};rooms.set(roomId,room);socket.join(roomId);socket.data.roomId=roomId;socket.data.side='w';socket.emit('room-created',{roomId,side:'w',game});});
  socket.on('join-room',({roomId,game,name='Guest Player'}={})=>{roomId=String(roomId||'').toUpperCase();const room=rooms.get(roomId);if(!room)return emitError(socket,'Room not found. Check the code or create a new room.');if(room.game!==game)return emitError(socket,'This room was created for a different game.');if(room.players.filter(p=>p.connected).length>=2&&!room.players.some(p=>p.id===socket.id))return emitError(socket,'This room is full.');let player=room.players.find(p=>p.side==='b');if(player){player.id=socket.id;player.name=name;player.connected=true;}else{player={id:socket.id,name,side:'b',connected:true};room.players.push(player);}socket.join(roomId);socket.data.roomId=roomId;socket.data.side='b';socket.emit('room-joined',{roomId,side:'b',game,state:room.draft,fen:room.chess.fen()});socket.emit('state-sync',syncRoom(room));io.to(roomId).emit('opponent-joined',{name,side:'b'});});
  socket.on('make-move',({roomId,payload}={})=>{const room=rooms.get(String(roomId||'').toUpperCase());if(!room||!room.players.some(p=>p.id===socket.id&&p.connected))return emitError(socket,'You are not an active player in this room.');if(!payload||payload.kind!==room.game)return emitError(socket,'Move payload does not match the room game.');const side=socket.data.side;
    if(room.game==='chess'){
      if(room.chess.turn()!==side)return emitError(socket,'It is not your turn.');const move=payload.move;if(!move||typeof move.from!=='string'||typeof move.to!=='string')return emitError(socket,'Invalid move payload.');try{const result=room.chess.move({from:move.from,to:move.to,...(move.promotion?{promotion:move.promotion}:{})});if(!result)return emitError(socket,'Illegal chess move.');}catch{return emitError(socket,'Illegal chess move.');}
    }else{
      if(room.draft.turn!==side)return emitError(socket,'It is not your turn.');const move=payload.move;if(!move||!Number.isInteger(move.from)||!Array.isArray(move.path))return emitError(socket,'Invalid move payload.');const key=draftMoveKey(move),legal=getDraftMoves(room.draft);const actual=legal.find(m=>draftMoveKey(m)===key);if(!actual)return emitError(socket,'Illegal draft move. Captures are compulsory when available.');room.draft=applyDraftMove(room.draft,actual);
    }
    room.lastSeen=Date.now();io.to(room.id).emit('state-sync',syncRoom(room));});
  socket.on('offer-draw',({roomId}={})=>{const room=rooms.get(String(roomId||'').toUpperCase());if(room&&room.players.some(p=>p.id===socket.id))socket.to(room.id).emit('draw-offer',{from:socket.id});});
  socket.on('disconnect',()=>{const roomId=socket.data.roomId,room=rooms.get(roomId);if(!room)return;const player=room.players.find(p=>p.id===socket.id);if(player)player.connected=false;socket.to(roomId).emit('opponent-disconnected',{side:socket.data.side});room.lastSeen=Date.now();});
});
const ttl=Number(process.env.ROOM_TTL_MS||12*60*60*1000);setInterval(()=>{for(const [id,room] of rooms)if(Date.now()-room.lastSeen>ttl)rooms.delete(id);},60*60*1000).unref();
const port=Number(process.env.PORT||3001);httpServer.listen(port,'0.0.0.0',()=>console.log(`Chess & Draft Arena realtime server listening on ${port}`));
