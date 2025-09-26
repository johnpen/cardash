import { logger } from  "@/lib/logger";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

function buildTokenUrl(): string {
  const tokenUrl = process.env.SF_TOKEN_URL;
  if (tokenUrl) return tokenUrl;
  const instance = process.env.SF_INSTANCE_URL;
  if (!instance) throw new Error("SF_TOKEN_URL or SF_INSTANCE_URL must be set");
  const base = instance.replace(/\/$/, "");
  return `${base}/services/oauth2/token`;
}

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    logger.debug("OAuth cache hit", { expiresAt: new Date(cachedToken.expiresAt).toISOString() });
    return cachedToken.accessToken;
  }

  const clientId = requireEnv("SF_CLIENT_ID");
  const clientSecret = requireEnv("SF_CLIENT_SECRET");
  const scope = process.env.SF_OAUTH_SCOPE; // optional
  const url = buildTokenUrl();

  const params = new URLSearchParams();
  params.set("grant_type", "client_credentials");
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  if (scope) params.set("scope", scope);

  logger.info("Requesting OAuth token (client_credentials)", {
    url: url.replace(/([?&]client_secret)=([^&#]+)/, "$1=***"),
    hasScope: Boolean(scope),
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    // Do not cache
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("OAuth token request failed", { status: res.status, body: text.slice(0, 2000) });
    throw new Error(`OAuth token request failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    token_type?: string;
    expires_in?: number;
  };

  if (!data.access_token) {
    logger.error("OAuth token response missing access_token");
    throw new Error("OAuth token response missing access_token");
  }

  const ttlMs = (data.expires_in ?? 3600) * 1000;
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + ttlMs,
  };
  logger.info("OAuth token acquired", { expiresInSec: data.expires_in ?? 3600 });

  return cachedToken.accessToken;
}

export function isClientCredentialsConfigured(): boolean {
  return Boolean(process.env.SF_CLIENT_ID && process.env.SF_CLIENT_SECRET);
}
