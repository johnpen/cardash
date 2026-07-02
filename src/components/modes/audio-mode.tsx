'use client';

import type { Dispatch, SetStateAction } from 'react';
import Image from 'next/image';
import { Pause, FastForward, Rewind } from 'lucide-react';
import type { Mode } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface AudioModeProps {
  setActiveMode: Dispatch<SetStateAction<Mode>>;
}

export default function AudioMode({ setActiveMode }: AudioModeProps) {
  const albumArt = PlaceHolderImages.find(img => img.id === 'album-art');
  
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <Card className="w-full max-w-xs border-0 bg-transparent shadow-none">
        <CardContent className="p-0 flex flex-col items-center">
          {albumArt && (
            <Image
              src={albumArt.imageUrl}
              alt={albumArt.description}
              width={300}
              height={300}
              className="rounded-lg aspect-square object-cover shadow-2xl"
              data-ai-hint={albumArt.imageHint}
            />
          )}
          <div className="text-center mt-4">
            <h2 className="text-xl font-bold">Midnight City</h2>
            <p className="text-muted-foreground">M83</p>
          </div>
        </CardContent>
      </Card>

      <div className="w-full max-w-sm">
        <Progress value={33} />
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>1:21</span>
            <span>4:03</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button size="icon" variant="ghost" className="h-14 w-14 rounded-full">
          <Rewind className="h-7 w-7" />
        </Button>
        <Button size="icon" variant="default" className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg">
          <Pause className="h-8 w-8" fill="currentColor" />
        </Button>
        <Button size="icon" variant="ghost" className="h-14 w-14 rounded-full">
          <FastForward className="h-7 w-7" />
        </Button>
      </div>
    </div>
  );
}
