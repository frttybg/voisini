"use client";

/**
 * Supabase Realtime için küçük bir istemci — ek paket yok.
 *
 * Supabase, Phoenix Channels protokolünü kullanır: WebSocket üzerinden
 * JSON mesajlar gider gelir. Bize gereken tek şey bir tabloya INSERT
 * geldiğinde haber almak, o yüzden protokolün yalnızca dört parçasını
 * uyguluyoruz: katıl, kalp atışı, jeton tazeleme, olay dinle.
 *
 * Bağlantı kurulamazsa (eski tarayıcı, ağ engeli, kurumsal güvenlik
 * duvarı) hata fırlatmaz; çağıran taraf yoklamaya geri döner.
 */

export type PostgresInsert<T> = { record: T };

type Options<T> = {
  table: string;
  /** PostgREST biçiminde süzgeç, örn. "conversation_id=eq.123" */
  filter?: string;
  onInsert: (row: T) => void;
  /** Bağlantı durumu değiştiğinde çağrılır. */
  onStatus?: (connected: boolean) => void;
};

type Credentials = { url: string; apikey: string; token: string };

const HEARTBEAT_MS = 25_000;
const RETRY_MS = [1_000, 3_000, 8_000, 20_000];

async function credentials(): Promise<Credentials | null> {
  try {
    const res = await fetch("/api/realtime/token", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<Credentials>;
    if (!data.url || !data.apikey || !data.token) return null;
    return { url: data.url, apikey: data.apikey, token: data.token };
  } catch {
    return null;
  }
}

export function subscribeToInserts<T>(options: Options<T>): () => void {
  let socket: WebSocket | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let closed = false;
  let ref = 0;

  const topic = `realtime:vsi:${options.table}:${options.filter ?? "all"}`;

  function send(message: unknown) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  }

  function cleanup() {
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = null;
    if (socket) {
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.onopen = null;
      try {
        socket.close();
      } catch {
        /* yoksay */
      }
    }
    socket = null;
  }

  function scheduleRetry() {
    if (closed) return;
    options.onStatus?.(false);
    const wait = RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)];
    attempt += 1;
    retry = setTimeout(connect, wait);
  }

  async function connect() {
    if (closed) return;
    const creds = await credentials();
    if (!creds || closed) {
      scheduleRetry();
      return;
    }

    const wsUrl =
      creds.url.replace(/^http/, "ws") +
      `/realtime/v1/websocket?apikey=${encodeURIComponent(creds.apikey)}&vsn=1.0.0`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      scheduleRetry();
      return;
    }
    socket = ws;

    ws.onopen = () => {
      attempt = 0;
      ref += 1;
      send({
        topic,
        event: "phx_join",
        ref: String(ref),
        payload: {
          config: {
            broadcast: { self: false },
            presence: { key: "" },
            postgres_changes: [
              {
                event: "INSERT",
                schema: "public",
                table: options.table,
                ...(options.filter ? { filter: options.filter } : {}),
              },
            ],
          },
          access_token: creds.token,
        },
      });

      heartbeat = setInterval(() => {
        ref += 1;
        send({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(ref) });
      }, HEARTBEAT_MS);
    };

    ws.onmessage = (event) => {
      let frame: {
        event?: string;
        payload?: {
          status?: string;
          data?: { type?: string; record?: T };
        };
      };
      try {
        frame = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (frame.event === "phx_reply" && frame.payload?.status === "ok") {
        options.onStatus?.(true);
        return;
      }

      if (frame.event === "postgres_changes") {
        const data = frame.payload?.data;
        if (data?.type === "INSERT" && data.record) options.onInsert(data.record);
      }
    };

    ws.onerror = () => {
      cleanup();
      scheduleRetry();
    };

    ws.onclose = () => {
      cleanup();
      scheduleRetry();
    };
  }

  connect();

  return () => {
    closed = true;
    if (retry) clearTimeout(retry);
    cleanup();
  };
}
