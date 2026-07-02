'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface WebViewModeProps {
  url: string;
}

export default function WebViewMode({ url }: WebViewModeProps) {
  if (!url) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No URL provided.</p>
      </div>
    );
  }

  return (
    <Card className="h-full w-full overflow-hidden">
      <CardContent className="p-0 h-full">
        <iframe
          src={url}
          className="h-full w-full border-0"
          title="Web View"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </CardContent>
    </Card>
  );
}
