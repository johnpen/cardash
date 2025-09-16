'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Bug } from 'lucide-react';
import { useLog } from './log-context';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { logs, clearLogs } = useLog();

  const levelColorMap = {
    log: 'text-gray-400',
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-500',
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="flex justify-center">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="secondary"
          className="rounded-b-none rounded-t-lg"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug Console
          {isOpen ? (
            <ChevronDown className="h-4 w-4 ml-2" />
          ) : (
            <ChevronUp className="h-4 w-4 ml-2" />
          )}
        </Button>
      </div>
      {isOpen && (
        <Card className="rounded-t-lg border-t-4 border-primary bg-card/95 backdrop-blur-sm max-h-[40vh]">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-lg">Debug Log</CardTitle>
            <Button variant="ghost" size="icon" onClick={clearLogs}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-full max-h-[calc(40vh-60px)]">
              <div className="p-4 font-mono text-xs space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-2 items-start"
                  >
                    <span className="text-muted-foreground">{log.timestamp.toLocaleTimeString()}</span>
                    <span className={cn('font-bold uppercase', levelColorMap[log.level])}>[{log.level}]</span>
                    <span className="whitespace-pre-wrap break-all">{log.message}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                    <div className="text-center text-muted-foreground p-4">No logs yet.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
