import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';


interface WebSocketMessage {
  type: 'SUBSCRIBE';
  pollId: string;
}

export interface CustomWebSocket extends WebSocket {
  subscribedPollId: string | null;
}

export interface ExtendedWebSocketServer extends WebSocketServer {
  broadcast(pollId: string, results: any): void;
}

// --- Subscription Management ---
const pollSubscriptions = new Map<string, Set<CustomWebSocket>>();

export function setupWebSocketServer(server: http.Server): ExtendedWebSocketServer {
  const wss = new WebSocketServer({ server }) as ExtendedWebSocketServer;
  console.log('WebSocket Server Setup Complete.');

  wss.on('connection', (ws: CustomWebSocket) => {
    console.log('A new client connected via WebSocket.');

    ws.subscribedPollId = null;

    ws.on('message', (message: string) => {
      try {
        const data: WebSocketMessage = JSON.parse(message);

        if (data.type === 'SUBSCRIBE' && data.pollId) {
          const pollId = data.pollId;
          unsubscribeClient(ws); // Unsubscribe from any previous poll.
          subscribeClient(ws, pollId); // Subscribe to the new one.
          
          console.log(`Client subscribed to poll: ${pollId}`);
          ws.send(JSON.stringify({ type: 'SUBSCRIBED', pollId }));
        }
      } catch (error) {
        console.error('WebSocket: Failed to parse message or invalid format.', error);
      }
    });

    ws.on('close', () => {
      console.log('Client has disconnected.');
      unsubscribeClient(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      unsubscribeClient(ws);
    });
  });

  wss.broadcast = (pollId: string, results: any) => {
    const subscribers = pollSubscriptions.get(pollId);
    if (!subscribers) return; 

    const message = JSON.stringify({
      type: 'POLL_UPDATE',
      pollId,
      results
    });

    console.log(`Broadcasting update for poll ${pollId} to ${subscribers.size} clients.`);
    subscribers.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  return wss;
}

function subscribeClient(ws: CustomWebSocket, pollId: string) {
  if (!pollSubscriptions.has(pollId)) {
    pollSubscriptions.set(pollId, new Set());
  }
  pollSubscriptions.get(pollId)?.add(ws);
  ws.subscribedPollId = pollId;
}

function unsubscribeClient(ws: CustomWebSocket) {
  if (ws.subscribedPollId) {
    const subscribers = pollSubscriptions.get(ws.subscribedPollId);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        pollSubscriptions.delete(ws.subscribedPollId);
      }
    }
    ws.subscribedPollId = null;
  }
}
