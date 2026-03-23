import { useEffect, useRef, useState, useCallback } from 'react';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  enabled?: boolean;
}

interface UseWebSocketReturn {
  sendMessage: (data: unknown) => void;
  status: ConnectionStatus;
  lastMessage: unknown | null;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  enabled = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<unknown | null>(null);

  // Store callbacks in refs so they don't trigger reconnection
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  const connectRef = useRef<() => void>(() => {});

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      setStatus('connecting');
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setStatus('connected');
        reconnectCountRef.current = 0;
        onOpenRef.current?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessageRef.current?.(data);
        } catch {
          // Non-JSON message
          setLastMessage(event.data);
          onMessageRef.current?.(event.data);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        onCloseRef.current?.();

        // Attempt reconnection
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current += 1;
          reconnectTimerRef.current = setTimeout(() => {
            connectRef.current();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setStatus('error');
        onErrorRef.current?.(event);
      };

      wsRef.current = ws;
    } catch {
      setStatus('error');
    }
  }, [url, enabled, reconnectAttempts, reconnectInterval]);

  useEffect(() => {
    connectRef.current = connect;
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  return { sendMessage, status, lastMessage };
}
