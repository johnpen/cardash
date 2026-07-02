import { NextRequest } from "next/server";
import { getAccessToken, invalidateToken } from "@/lib/auth";
import { logger } from "@/lib/logger"

const AGENT_API_BASE = "https://api.salesforce.com/einstein/ai-agent/v1";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  if (!sessionId) {
    logger.warn("Stream request missing sessionId");
    return new Response(JSON.stringify({ error: "Missing sessionId in path" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { text, sequenceId, inReplyToMessageId, variables } = body;
  if (!text || typeof sequenceId !== "number") {
    logger.warn("Stream request validation failed", { hasText: Boolean(text), sequenceIdType: typeof sequenceId });
    return new Response(JSON.stringify({ error: "text and sequenceId are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const upstreamBody = {
    message: {
      type: "Text",
      sequenceId,
      ...(inReplyToMessageId ? { inReplyToMessageId } : {}),
      text,
    },
    ...(Array.isArray(variables) ? { variables } : {}),
  };

  const upstreamUrl = `${AGENT_API_BASE}/sessions/${encodeURIComponent(sessionId)}/messages/stream`;

  const makeRequest = async (isRetry = false): Promise<Response> => {
    const token = await getAccessToken();
    const res = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Accept: "text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(upstreamBody),
    });

    if (res.status === 401 && !isRetry) {
      logger.warn("Stream request unauthorized, invalidating token and retrying...");
      invalidateToken();
      return makeRequest(true); // Retry once
    }

    return res;
  };

  const upstream = await makeRequest();

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    logger.warn("Upstream stream error", { status: upstream.status, body: text.slice(0, 2000) });
    return new Response(text || JSON.stringify({ error: "Upstream error" }), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
    });
  }

  const headers = new Headers();
  headers.set("content-type", "text/event-stream");
  headers.set("cache-control", "no-cache, no-transform");
  headers.set("connection", "keep-alive");

  const stream = new ReadableStream({
    start(controller) {
      const reader = upstream.body!.getReader();
      const pump = () =>
        reader.read().then(({ done, value }) => {
          if (done) {
            logger.debug("Proxy stream completed");
            controller.close();
            return;
          }
          controller.enqueue(value!);
          pump();
        }).catch((err) => {
          logger.error("Proxy stream error", { message: String(err?.message || err) });
          controller.error(err);
        });
      pump();
    },
    cancel() {
      try { upstream.body?.cancel(); } catch {}
    }
  });

  return new Response(stream, { status: 200, headers });
}
