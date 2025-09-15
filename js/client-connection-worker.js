"use strict";


var socket=null;
var serverInfo;
var reconnectTimeout=null;
var queue=[];

self.onmessage=function(event){
var _event$data=event.data,type=_event$data.type,server=_event$data.server,data=_event$data.data;
if(type==='connect'){
serverInfo=server;
connectToServer();
}else if(type==='send'){
if(socket&&socket.readyState===WebSocket.OPEN){
socket.send(data);
}else{
queue.push(data);
}
}else if(type==='disconnect'){
if(socket)socket.close();
if(reconnectTimeout)clearTimeout(reconnectTimeout);
socket=null;
}
};

function connectToServer(){

var prefix='/showdown';
var host='server.pokemondnd.xyz';
var protocol='https';
var baseURL=protocol+"://"+host+prefix;

try{

socket=new SockJS(baseURL,[],{timeout:5*60*1000});
}catch(err){
try{
socket=new WebSocket(baseURL.replace('http','ws')+'/websocket');
}catch(err2){
postMessage({type:'error',data:'Failed to create socket: '+err2.message});
return;
}
}

if(!socket){
postMessage({type:'error',data:'No socket created'});
return;
}

socket.onopen=function(){
postMessage({type:'connected'});for(var _i2=0,_queue2=
queue;_i2<_queue2.length;_i2++){var _socket;var msg=_queue2[_i2];(_socket=socket)==null||_socket.send(msg);}
queue=[];
};

socket.onmessage=function(e){
postMessage({type:'message',data:e.data});
};

socket.onclose=function(){
postMessage({type:'disconnected'});
};

socket.onerror=function(err){var _socket2;
postMessage({type:'error',data:err.message||''});
(_socket2=socket)==null||_socket2.close();
};
}
//# sourceMappingURL=client-connection-worker.js.map