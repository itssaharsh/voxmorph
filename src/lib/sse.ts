import type { MorphEvent } from "@/state/types";

/* ───────────────────────── server ───────────────────────── */

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

export function createSseWriter(controller: ReadableStreamDefaultController<Uint8Array>) {
  const enc = new TextEncoder();
  let closed = false;

  const raw = (chunk: string) => {
    if (closed) return;
    try { controller.enqueue(enc.encode(chunk)); }
    catch { closed = true; } // client disconnected
  };

  return {
    /** Flushed before any upstream work so headers commit immediately. */
    open: () => raw(": open\n\n"),
    ping: () => raw(": ping\n\n"),
    send: (event: MorphEvent) => raw(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`),
    close: () => {
      if (closed) return;
      closed = true;
      try { controller.close(); } catch { /* already closed */ }
    },
    get closed() { return closed; },
  };
}

/* ───────────────────────── client ───────────────────────── */

/**
 * Parses an SSE byte stream into MorphEvents.
 * We cannot use EventSource: it is GET-only and we are POSTing audio.
 */
export async function* parseSseStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<MorphEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        if (frame.startsWith(":")) continue; // comment / heartbeat

        const data = frame
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trim())
          .join("\n");
        if (!data) continue;

        try { yield JSON.parse(data) as MorphEvent; }
        catch { /* ignore a malformed frame rather than killing the stream */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
