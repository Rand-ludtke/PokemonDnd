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
	// Use SockJS endpoint first; fallback to raw WebSocket /websocket
	const prefix = '/showdown';
	const host = 'server.pokemondnd.xyz';
	const protocol = 'https';
	const baseURL = `${protocol}://${host}${prefix}`;
	postMessage({ type: 'debug', data: '[worker] baseURL ' + baseURL + ' t=' + Date.now() });

	try {
		const start = Date.now();
		// SockJS constructor may throw synchronously if not available/blocked
		socket = new SockJS(baseURL, [], { timeout: 5 * 60 * 1000 });
		postMessage({ type: 'debug', data: '[worker] SockJS created in ' + (Date.now()-start) + 'ms' });
	} catch (err) {
		postMessage({ type: 'debug', data: '[worker] SockJS failed ' + (err as any).message });
		try {
			const wsURL = baseURL.replace('http', 'ws') + '/websocket';
			postMessage({ type: 'debug', data: '[worker] attempting WS fallback ' + wsURL });
			socket = new WebSocket(wsURL);
		} catch (err2) {
			postMessage({ type: 'error', data: 'Failed to create socket: ' + (err2 as any).message });
			return;
		}
	}

	if (!socket) {
		postMessage({ type: 'error', data: 'No socket created' });
		return;
	}

	socket.onopen = () => {
		postMessage({ type: 'debug', data: '[worker] onopen t=' + Date.now() });
		postMessage({ type: 'connected' });
		for (const msg of queue) socket?.send(msg);
		queue = [];
	};

	socket.onmessage = (e: MessageEvent) => {
		// only sample some frames for debug to avoid noise
		if (typeof e.data === 'string' && e.data.length < 200) {
			postMessage({ type: 'debug', data: '[worker] frame sample ' + e.data.slice(0,80) });
		}
		postMessage({ type: 'message', data: e.data });
	};

	socket.onclose = () => {
		postMessage({ type: 'debug', data: '[worker] onclose t=' + Date.now() });
		postMessage({ type: 'disconnected' });
	};

	socket.onerror = (err: Event) => {
		postMessage({ type: 'error', data: (err as any).message || '' });
		postMessage({ type: 'debug', data: '[worker] onerror t=' + Date.now() });
		socket?.close();
	};
}
