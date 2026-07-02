'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from '@/contexts/chat-context';


interface ChatInputProps {
  onSendMessage: (input: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isOpen } = useChat();

  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (input.trim()) {
      stop();
      onSendMessage(input);
      setInput('');
      textareaRef.current?.focus();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Textarea
      id="txtMsg"
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={(e) =>  setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="How can I help..."
        className="flex-1 resize-none"
        rows={1}
        disabled={disabled}
      />

      <Button type="submit" id='sendBut' size="icon" disabled={disabled || !input.trim()}>
        <Send className="h-4 w-4" />
      </Button>
      <Button type="button" id="lisenBut" size="icon" onClick={() => start()} >
        <Mic className="h-4 w-4" />
      </Button>      
    </form>
  );
}
