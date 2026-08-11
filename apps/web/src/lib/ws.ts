import { useEffect, useRef, useState } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';

type WSMessage = {
  type: string;
  [key: string]: any;
};

export function useWebSocket(clinicId: string, roomId?: string, onMessage?: (message: WSMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const connect = () => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);

      ws.send(JSON.stringify({ type: 'subscribe', clinicId, roomId }));

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        if (onMessage) {
          onMessage(message);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);

      // A socket closed during page cleanup must not create a new connection.
      if (wsRef.current !== ws) return;
      wsRef.current = null;

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Reconnecting...');
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  useEffect(() => {
    connect();

    return () => {
      const socket = wsRef.current;
      if (socket) {
        // Only an open socket can accept an unsubscribe message. This also
        // happens during React development-mode cleanup while it is connecting.
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'unsubscribe', clinicId, roomId }));
        }
        if (wsRef.current === socket) wsRef.current = null;
        socket.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [clinicId, roomId]);

  return { connected };
}
