'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  seen: boolean
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
          <p>Hello! I'm your Car AI assistant.</p>
          <p>How can I help you today?</p>
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
          {message.role === 'assistant' && (
            <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
              <AvatarFallback>
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
          <div
            className={cn(
              'p-3 rounded-lg max-w-sm prose prose-sm dark:prose-invert prose-p:my-0 prose-headings:my-1',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
           {message.role === 'assistant' ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            ) : (
              message.content
            )}
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
