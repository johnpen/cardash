'use client';

import Image from 'next/image';
import { Play, Pause, FastForward, Rewind } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function AudioMode() {
  const albumArt = PlaceHolderImages.find(img => img.id === 'album-art');
  
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <Card className="w-full max-w-sm border-0 bg-transparent shadow-none">
        <CardContent className="p-0 flex flex-col items-center">
          {albumArt && (
            <Image
              src={albumArt.imageUrl}
              alt={albumArt.description}
              width={400}
              height={400}
              className="rounded-lg aspect-square object-cover shadow-2xl"
              data-ai-hint={albumArt.imageHint}
            />
          )}
          <div className="text-center mt-6">
            <h2 className="text-2xl font-bold">Midnight City</h2>
            <p className="text-muted-foreground text-lg">M83</p>
          </div>
        </CardContent>
      </Card>

      <div className="w-full max-w-md">
        <Progress value={33} />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>1:21</span>
            <span>4:03</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button size="icon" variant="ghost" className="h-16 w-16 rounded-full">
          <Rewind className="h-8 w-8" />
        </Button>
        <Button size="icon" variant="default" className="h-20 w-20 rounded-full bg-primary text-primary-foreground shadow-lg">
          <Pause className="h-10 w-10" fill="currentColor" />
        </Button>
        <Button size="icon" variant="ghost" className="h-16 w-16 rounded-full">
          <FastForward className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
