
'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode, useMemo } from 'react';
import { useLog } from '@/components/debug/log-context';
import type { Mode, TTSEngine } from '@/lib/types';
import { synthesizeText } from '@/lib/onnx-tts';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  messages: Message[];
  loading: boolean;
  sendMessage: (input: string) => void;
  sendSystemMessage: (input: string, openWhenDone: boolean) => void;
  setActiveMode: (mode: Mode) => void;
  setWebViewUrl: (url: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  setActiveMode: (mode: Mode) => void;
  setWebViewUrl: (url: string) => void;
  ttsEngine: TTSEngine;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, setActiveMode, setWebViewUrl, ttsEngine }) => {
  

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const seqRef = useRef(1);
  const { addLog } = useLog();


  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    addLog('Starting new agent session...', 'info');
    const res = await fetch("/api/agent/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ 
        streaming: true,
        variables: [{ name: 'vinNum', type: 'Text', value: '1HMFHT9P3AASCA56E' }]
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      addLog(`Failed to start session: ${t}`, 'error');
      throw new Error(`Start session failed: ${res.status} ${t}`);
    }
    const data = await res.json();
    if (!data?.sessionId) {
      addLog('No sessionId in start response', 'error');
      throw new Error("No sessionId in start response");
    }
    addLog(`Agent session started: ${data.sessionId}`, 'info');
    setSessionId(data.sessionId);
    return data.sessionId as string;
  }, [sessionId, addLog]);
  
  const playAudio = useCallback(async (text: string) => {
    if (!text) return;
    
    if (ttsEngine === 'off') {
        addLog('TTS is off. Displaying text immediately.', 'info');
        // The message is already streamed to the UI when TTS is off.
        // This function call is now only for audio playback.
        return;
    }

    const showMessageAndPlay = (audioSrc: string) => {
        const audio = new Audio(audioSrc);
        audio.play();
        // Reveal the full message at once when audio starts playing
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            last.content = text;
          }
          return copy;
        });
    };

    if (ttsEngine === 'onnx') {
        try {
            addLog('Synthesizing with ONNX...', 'info');
            const audioDataUri = await synthesizeText(text);
            if (audioDataUri) {
                showMessageAndPlay(audioDataUri);
            } else {
                 throw new Error('ONNX synthesis returned no data.');
            }
        } catch (error: any) {
            addLog(`ONNX TTS failed: ${error.message}`, 'error');
            // Fallback to showing text if audio fails
            setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") {
                    last.content = text;
                }
                return copy;
            });
        }
    } else { // 'cartesia'
        try {
            addLog('Fetching audio from Cartesia API...', 'info');
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`TTS API failed: ${res.status} ${errorText}`);
            }
            
            const audioBlob = await res.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            showMessageAndPlay(audioUrl);

        } catch (error: any) {
            addLog(`Cartesia TTS failed: ${error.message}`, 'error');
            // Fallback to showing text if audio fails
            setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") {
                    last.content = text;
                }
                return copy;
            });
        }
    }
  }, [addLog, ttsEngine]);

  const handleStream = useCallback(async (text: string, isSystemMessage: boolean, openWhenDone: boolean) => {
    setLoading(true);

    const initialAssistantMessage = { role: 'assistant' as const, content: "" };

    if (isSystemMessage) {
      setMessages((m) => [...m, initialAssistantMessage]);
    } else {
      setMessages((m) => [...m, { role: "user", content: text }, initialAssistantMessage]);
    }
    
    let assistantBuffer = "";

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
      
      if (!isOpen && !isSystemMessage) {
        setIsOpen(true);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processChunk = (chunk: string) => {
        buffer += chunk;
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
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
            const evt = eventType || payload?.event;
            const messageObj = payload?.data?.message || payload?.message;

            if (evt === "TEXT_CHUNK" && messageObj?.message) {
              assistantBuffer += messageObj?.message;
              if (ttsEngine === 'off') {
                setMessages((m) => {
                  const copy = m.slice();
                  const last = copy[copy.length - 1];
                  if (last?.role === "assistant") last.content = assistantBuffer;
                  return copy;
                });
              }
            } else if (evt === "END_OF_TURN") {
              addLog('End of turn...', 'info');
                if (openWhenDone) {
                    setIsOpen(true);
                }
                playAudio(assistantBuffer);
                if (ttsEngine === 'off') {
                  setMessages((m) => {
                    const copy = m.slice();
                    const last = copy[copy.length - 1];
                    if (last?.role === "assistant") last.content = assistantBuffer;
                    return copy;
                  });
                }
                const match = assistantBuffer.match(/https?:\/\/[^\s,.)]*my\.site\.com\/pay\/[^\s,.)]*/);
                if (match) {
                    const url = match[0];
                    addLog(`Payment link detected: ${url}`, 'info');
                    setWebViewUrl(url);
                    setActiveMode('webview');
                }

            } else if (evt === "ERROR") {
              const errMsg = payload?.data?.message || "Upstream error";
              throw new Error(errMsg);
            }
          } catch (e) {
            // ignore JSON parse issues
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        processChunk(decoder.decode(value, { stream: true }));
      }
    } catch (e: any) {
      addLog(`Chat stream error: ${e.message}`, 'error');
      assistantBuffer = `Error: ${e?.message || e}`;
      setMessages((m) => {
        const copy = m.slice();
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") last.content = assistantBuffer;
        else copy.push({ role: 'assistant', content: assistantBuffer });
        return copy;
      });
      if (openWhenDone) setIsOpen(true);
    } finally {
      setLoading(false);
    }
  }, [ensureSession, addLog, setActiveMode, setWebViewUrl, playAudio, isOpen, ttsEngine]);

  const sendMessage = useCallback((input: string) => {
    if (input.trim()) {
      handleStream(input, false, true);
    }
  }, [handleStream]);

  const sendSystemMessage = useCallback((input: string, openWhenDone: boolean) => {
    if (input.trim()) {
      handleStream(input, true, openWhenDone);
    }
  }, [handleStream]);


  const contextValue = useMemo(() => ({
    isOpen,
    setIsOpen,
    messages,
    loading,
    sendMessage,
    sendSystemMessage,
    setActiveMode,
    setWebViewUrl,
  }), [isOpen, messages, loading, sendMessage, sendSystemMessage, setActiveMode, setWebViewUrl]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
