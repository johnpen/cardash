
'use client';

import { useEffect, useRef } from 'react';
import { Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useChat } from '@/contexts/chat-context';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

export function ChatPanel() {
  const {
    isOpen,
    setIsOpen,
    messages,
    sendMessage,
    loading,
  } = useChat();

  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [messages]);


  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="rounded-full h-16 w-16 absolute bottom-6 right-6 shadow-lg bg-primary hover:bg-accent text-primary-foreground"
          aria-label="Open AI Chat"
        >
          <Bot className="h-8 w-8" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        className="w-full sm:max-w-md flex flex-col p-0"
        >
        <SheetHeader className="px-5 pb-1">
          <SheetTitle>Car AI Assistant</SheetTitle>
        </SheetHeader>
        <div id="error"></div>

        <Separator />
        <ScrollArea className="flex-1 p-4" viewportRef={scrollViewportRef}>
          <ChatMessages messages={messages} />
        </ScrollArea>
        <div id="results"  style={{display: 'none'}}>
                        <div className="results-placeholder">
                            <div className="results-placeholder-icon">🎤</div>
                            <p>Generated speech will appear here</p>
                        </div>
        </div>
        <Separator />
        <div className="p-4">
          <ChatInput onSendMessage={sendMessage} disabled={loading} />
        </div>
        <input type="text" id='ttsmsg' style={{display:'none'}} />
      </SheetContent>
    </Sheet>
        
    
  );
}
