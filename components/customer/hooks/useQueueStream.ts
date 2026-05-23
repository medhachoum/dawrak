"use client";

import { useEffect, useRef, useState } from "react";

export type QueueStreamEventType =
  | "connected"
  | "join"
  | "called"
  | "completed"
  | "noshow"
  | "reset"
  | "heartbeat";

export interface QueueStreamEvent {
  type: QueueStreamEventType;
  queueId?: string;
  entryId?: string;
  ticketNumber?: number;
  at?: string;
}

export interface UseQueueStreamOptions {
  queueId: string | null | undefined;
  onEvent?: (event: QueueStreamEvent) => void;
  /** Reconnect delay in ms when the stream closes unexpectedly. */
  reconnectDelayMs?: number;
}

export interface UseQueueStreamResult {
  connected: boolean;
  lastEvent: QueueStreamEvent | null;
}

/**
 * Subscribes to the queue SSE endpoint and invokes `onEvent` for every event.
 * Automatically reconnects if the connection drops.
 */
export function useQueueStream({
  queueId,
  onEvent,
  reconnectDelayMs = 3000,
}: UseQueueStreamOptions): UseQueueStreamResult {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<QueueStreamEvent | null>(null);
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!queueId) return;

    let cancelled = false;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const eventTypes: QueueStreamEventType[] = [
      "connected",
      "join",
      "called",
      "completed",
      "noshow",
      "reset",
      "heartbeat",
    ];

    const parse = (type: QueueStreamEventType, raw: string): QueueStreamEvent => {
      try {
        const data = JSON.parse(raw) as Partial<QueueStreamEvent>;
        return { ...data, type };
      } catch {
        return { type };
      }
    };

    const connect = () => {
      if (cancelled) return;
      es = new EventSource(`/api/queue/${queueId}/stream`);

      es.addEventListener("open", () => {
        if (!cancelled) setConnected(true);
      });

      for (const t of eventTypes) {
        es.addEventListener(t, (ev: MessageEvent) => {
          if (cancelled) return;
          const parsed = parse(t, ev.data);
          setLastEvent(parsed);
          if (t === "connected") setConnected(true);
          handlerRef.current?.(parsed);
        });
      }

      es.addEventListener("error", () => {
        if (cancelled) return;
        setConnected(false);
        es?.close();
        es = null;
        reconnectTimer = setTimeout(connect, reconnectDelayMs);
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
      es = null;
      setConnected(false);
    };
  }, [queueId, reconnectDelayMs]);

  return { connected, lastEvent };
}
