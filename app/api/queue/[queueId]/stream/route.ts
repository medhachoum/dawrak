import { prisma } from "@/lib/db";
import {
  subscribeToQueue,
  type QueueEvent,
} from "@/lib/queue-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEARTBEAT_MS = 30_000;

function sseChunk(event: string, data: unknown): Uint8Array {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  const text = `event: ${event}\ndata: ${payload}\n\n`;
  return new TextEncoder().encode(text);
}

export async function GET(
  req: Request,
  { params }: { params: { queueId: string } },
) {
  const queue = await prisma.queue.findUnique({
    where: { id: params.queueId },
    select: { id: true },
  });
  if (!queue) {
    return new Response(
      JSON.stringify({ success: false, error: "الطابور غير موجود" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const safeEnqueue = (chunk: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(chunk);
        } catch {
          closed = true;
        }
      };

      // Initial connection hint.
      safeEnqueue(
        sseChunk("connected", {
          queueId: params.queueId,
          at: new Date().toISOString(),
        }),
      );

      const unsubscribe = subscribeToQueue(params.queueId, (event: QueueEvent) => {
        safeEnqueue(sseChunk(event.type, event));
      });

      const heartbeat = setInterval(() => {
        safeEnqueue(
          sseChunk("heartbeat", {
            queueId: params.queueId,
            at: new Date().toISOString(),
          }),
        );
      }, HEARTBEAT_MS);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Controller may already be closed.
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
