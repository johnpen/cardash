'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-muted-foreground p-8">
          <Bot className="mx-auto h-12 w-12 mb-4" />
          <p>Hello! I'm your DriveAI assistant.</p>
          <p>Ask me about your car's status.</p>
        </div>
      )}
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            'flex items-start gap-3',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          {message.role === 'ai' && (
            <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
              <AvatarFallback>
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
          <div
            className={cn(
              'p-3 rounded-lg max-w-sm whitespace-pre-wrap',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            {message.content}
          </div>
           {message.role === 'user' && (
            <Avatar className="h-8 w-8 bg-secondary text-secondary-foreground">
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
    </div>
  );
}
