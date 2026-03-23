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

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    reconnectCountRef.current = 0;

    function doConnect() {
      if (cancelled) return;

      try {
        if (!cancelled) setStatus('connecting');
        const ws = new WebSocket(url);

        ws.onopen = () => {
          if (cancelled) { ws.close(); return; }
          setStatus('connected');
          reconnectCountRef.current = 0;
          onOpenRef.current?.();
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
            onMessageRef.current?.(data);
          } catch {
            setLastMessage(event.data);
            onMessageRef.current?.(event.data);
          }
        };

        ws.onclose = () => {
          if (cancelled) return;
          setStatus('disconnected');
          onCloseRef.current?.();

          if (reconnectCountRef.current < reconnectAttempts) {
            reconnectCountRef.current += 1;
            reconnectTimerRef.current = setTimeout(doConnect, reconnectInterval);
          }
        };

        ws.onerror = (event) => {
          if (cancelled) return;
          setStatus('error');
          onErrorRef.current?.(event);
        };

        wsRef.current = ws;
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    doConnect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url, enabled, reconnectAttempts, reconnectInterval]);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  return { sendMessage, status, lastMessage };
}
