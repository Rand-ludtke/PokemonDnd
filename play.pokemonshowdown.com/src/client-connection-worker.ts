declare const SockJS: any;
import type { ServerInfo } from "./client-main";

let socket: WebSocket | null = null;
let serverInfo: ServerInfo;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let queue: string[] = [];

self.onmessage = (event: MessageEvent) => {
	const { type, server, data } = event.data;
	if (type === 'connect') {
		serverInfo = server;
		connectToServer();
	} else if (type === 'send') {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(data);
		} else {
			queue.push(data);
		}
	} else if (type === 'disconnect') {
		if (socket) socket.close();
		if (reconnectTimeout) clearTimeout(reconnectTimeout);
		socket = null;
	}
};

function connectToServer() {
	// Always use your backend WebSocket endpoint
	const url = 'wss://server.pokemondnd.xyz/showdown/';

	try {
		socket = new WebSocket(url);
	} catch {
		socket = null;
		postMessage({ type: 'error', data: 'Failed to connect to WebSocket at ' + url });
		return;
	}
	if (socket) {
		socket.onopen = () => {
			postMessage({ type: 'connected' });
			for (const msg of queue) socket?.send(msg);
			queue = [];
		};

		socket.onmessage = (e: MessageEvent) => {
			postMessage({ type: 'message', data: e.data });
		};

		socket.onclose = () => {
			postMessage({ type: 'disconnected' });
			// scheduleReconnect();
		};

		socket.onerror = (err: Event) => {
			postMessage({ type: 'error', data: (err as any).message || '' });
			socket?.close();
		};
		return;
	}
	return postMessage({ type: 'error' });
}
