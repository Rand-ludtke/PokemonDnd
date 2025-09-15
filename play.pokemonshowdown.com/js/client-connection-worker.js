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

var url='wss://server.pokemondnd.xyz/showdown/';

try{
socket=new WebSocket(url);
}catch(_unused){
socket=null;
postMessage({type:'error',data:'Failed to connect to WebSocket at '+url});
return;
}
if(socket){
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
return;
}
return postMessage({type:'error'});
}
//# sourceMappingURL=client-connection-worker.js.map