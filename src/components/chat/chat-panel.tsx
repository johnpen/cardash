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

  const [isOpen, setIsOpen] = useState(false);
  const { addLog } = useLog();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0" style="display: flex, flexDirection: column, height:100%">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>DriveAI Assistant</SheetTitle>
        </SheetHeader>
        <iframe src="https://agent-force-chat-bd30a367ff05.herokuapp.com/" style={{height:"100%"}}></iframe>
      </SheetContent>
    </Sheet>
  );
}
