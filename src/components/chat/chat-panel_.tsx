"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type ChatMsg = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const seqRef = useRef(1);
  const assistantBufferRef = useRef("");

  const disabled = useMemo(() => loading || !input.trim(), [loading, input]);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    const res = await fetch("/api/agent/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ streaming: true }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Start session failed: ${res.status} ${t}`);
    }
    const data = await res.json();
    if (!data?.sessionId) {
      throw new Error("No sessionId in start response");
    }
    setSessionId(data.sessionId);
    return data.sessionId as string;
  }, [sessionId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setLoading(true);
    assistantBufferRef.current = "";

    try {
      const sid = await ensureSession();
      const res = await fetch(`/api/agent/${encodeURIComponent(sid)}/stream`, {
        method: "POST",
        headers: { "content-type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ text, sequenceId: seqRef.current++ }),
      });
      if (!res.ok || !res.body) {
        const t = await res.text();
        throw new Error(`Stream failed: ${res.status} ${t}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const processChunk = (chunk: string) => {
        buffer += chunk;
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || ""; // keep last partial
        for (const part of parts) {
          // Parse SSE event
          const lines = part.split("\n");
          let eventType: string | null = null;
          let dataLines: string[] = [];
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).trim());
            }
          }
          if (!dataLines.length) continue;
          const dataStr = dataLines.join("\n");
          try {
            const payload = JSON.parse(dataStr);
            const evt = eventType || payload?.event; // fallback
            // Salesforce format: { event, data: { message: { type, ... } } }
            const messageObj = payload?.data?.message || payload?.message;

            if (evt === "TEXT_CHUNK" && messageObj?.message) {
              assistantBufferRef.current += messageObj.message;
              setMessages((m) => {
                const copy = m.slice();
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") last.content = assistantBufferRef.current;
                return copy;
              });
            } else if (evt === "INFORM" && messageObj?.message) {
              // Non-chunked final message
              assistantBufferRef.current = messageObj.message;
              setMessages((m) => {
                const copy = m.slice();
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") last.content = assistantBufferRef.current;
                return copy;
              });
            } else if (evt === "END_OF_TURN") {
              // finalize current assistant message
            } else if (evt === "ERROR") {
              const errMsg = payload?.data?.message || "Upstream error";
              throw new Error(errMsg);
            }
          } catch (e) {
            // ignore JSON parse issues for keep-alive/comments
          }
        }
      };

      // Pump the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        processChunk(decoder.decode(value, { stream: true }));
      }
    } catch (e: any) {
      console.error(e);
      setMessages((m) => {
        const copy = m.slice();
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") last.content = `Error: ${e?.message || e}`;
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }, [input, ensureSession]);

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto p-6 gap-4">
      <h1 className="text-2xl font-semibold">Salesforce Agent Streaming Chat</h1>
      <div className="flex-1 rounded-lg border border-black/10 dark:border-white/10 p-4 overflow-auto bg-white/40 dark:bg-black/20">
        {messages.length === 0 ? (
          <p className="text-sm opacity-70">Start the conversation below. The assistant response will stream in real time.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m, i) => (
              <li key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={
                  "inline-block rounded-lg px-3 py-2 " +
                  (m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap")
                }>
                  {m.content}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-black/10 dark:border-white/10 px-3 py-2 bg-white dark:bg-black"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!disabled) handleSend();
            }
          }}
        />
        <button
          className="rounded-md px-4 py-2 bg-black text-white disabled:opacity-50 dark:bg-white dark:text-black"
          disabled={disabled}
          onClick={handleSend}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
      <div className="text-xs opacity-60">
        Session: {sessionId ?? "(none)"}
      </div>
    </div>
  );
}
