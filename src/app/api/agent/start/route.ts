import { NextRequest } from "next/server";
import { getAccessToken, isClientCredentialsConfigured } from "@/lib/auth";
import { logger } from "@/lib/logger";

const AGENT_API_BASE = "https://api.salesforce.com/einstein/ai-agent/v1";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} is not set`);
  }
  return v;
}

export async function POST(req: NextRequest) {
  try {
    const { agentId, instanceEndpoint, externalSessionKey, streaming } = await req.json().catch(() => ({}));
    logger.info("Start session request", {
      hasAgentId: Boolean(agentId || process.env.SF_AGENT_ID),
      hasInstanceEndpoint: Boolean(instanceEndpoint || process.env.SF_INSTANCE_URL),
      streaming: Boolean(streaming),
      clientCredentials: isClientCredentialsConfigured(),
    });

    const AGENT_ID = agentId || process.env.SF_AGENT_ID;
    const INSTANCE_ENDPOINT = instanceEndpoint || process.env.SF_INSTANCE_URL;
    const token = await getAccessToken();

    if (!AGENT_ID) {
      logger.warn("Missing agentId");
      return new Response(
        JSON.stringify({ error: "Missing agentId. Provide in request or set SF_AGENT_ID" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    if (!INSTANCE_ENDPOINT) {
      logger.warn("Missing instanceEndpoint");
      return new Response(
        JSON.stringify({ error: "Missing instanceEndpoint. Provide in request or set SF_INSTANCE_URL" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const startBody: any = {
      externalSessionKey: externalSessionKey || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`),
      instanceConfig: {
        endpoint: INSTANCE_ENDPOINT,
      },
      ...(streaming
        ? { streamingCapabilities: { chunkTypes: ["Text"] } }
        : {}),
    };

    // When using client credentials, instruct API to use the agent-assigned user
    if (isClientCredentialsConfigured()) {
      startBody.bypassUser = true;
    }

    const url = `${AGENT_API_BASE}/agents/${encodeURIComponent(AGENT_ID)}/sessions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(startBody),
    });
    logger.info("Start session upstream response", { status: res.status });
    const text = await res.text();
    const headers = { "content-type": res.headers.get("content-type") || "application/json" } as Record<string, string>;

    return new Response(text, { status: res.status, headers });
  } catch (err: any) {
    logger.error("/api/agent/start error", { message: err?.message });
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
