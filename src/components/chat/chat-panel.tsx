'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { ChatMessages, type Message } from './chat-messages';
import { ChatInput } from './chat-input';
import { getAiResponse } from '@/lib/actions';
import { ScrollArea } from '../ui/scroll-area';
import { useLog } from '@/components/debug/log-context';

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { addLog } = useLog();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (input: string) => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await getAiResponse(input);
      const aiMessage: Message = { role: 'ai', content: response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      addLog(`Chat error: ${error.message}`, 'error');
      const errorMessage: Message = {
        role: 'ai',
        content: 'Sorry, I am having trouble connecting. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="rounded-full h-14 w-14 absolute bottom-24 right-4 sm:bottom-28 sm:right-6 shadow-lg bg-primary hover:bg-accent text-primary-foreground"
          aria-label="Open AI Chat"
        >
          <Bot className="h-7 w-7" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>DriveAI Assistant</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <ChatMessages messages={messages} />
        </ScrollArea>
        <SheetFooter className="p-6 pt-2 bg-card">
          <div className="w-full">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>DriveAI is thinking...</span>
              </div>
            )}
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
