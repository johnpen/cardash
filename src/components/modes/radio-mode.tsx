'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const presets = ['98.1', '102.5', '104.3', '88.7', '94.9'];

export default function RadioMode() {
  const [band, setBand] = useState('fm');
  const [frequency, setFrequency] = useState('102.5');

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-4">
      <Card className="w-full max-w-lg border-0 bg-transparent shadow-none text-center">
        <CardContent className="p-0">
          <div className="flex justify-center items-end mb-4">
            <h1 className="text-8xl font-bold tracking-tighter">{frequency}</h1>
            <span className="text-3xl font-semibold ml-2 text-primary">{band.toUpperCase()}</span>
          </div>
          <p className="text-lg text-muted-foreground">Indie Pop Radio</p>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center gap-4">
        <Button size="icon" variant="ghost" className="h-16 w-16 rounded-full">
          <ChevronLeft className="h-10 w-10" />
        </Button>
        <Button size="icon" variant="ghost" className="h-20 w-20 rounded-full">
          <Heart className="h-8 w-8" />
        </Button>
        <Button size="icon" variant="ghost" className="h-16 w-16 rounded-full">
          <ChevronRight className="h-10 w-10" />
        </Button>
      </div>

      <div className="w-full max-w-xl space-y-4">
         <div className="flex justify-center">
            <ToggleGroup type="single" value={band} onValueChange={(value) => value && setBand(value)} >
                <ToggleGroupItem value="fm" aria-label="FM">FM</ToggleGroupItem>
                <ToggleGroupItem value="am" aria-label="AM">AM</ToggleGroupItem>
            </ToggleGroup>
         </div>
         <Card className="bg-card/50">
            <CardContent className="p-4 flex justify-around">
                {presets.map(p => (
                    <Button key={p} variant={frequency === p ? 'default' : 'ghost'} onClick={() => setFrequency(p)} className="text-lg">
                        {p}
                    </Button>
                ))}
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

// Dummy ToggleGroup components until they are available in shadcn
function DummyToggleGroup({ children, ...props }: any) {
    return <div {...props}>{children}</div>;
}
function DummyToggleGroupItem({ children, ...props }: any) {
    return <Button variant={props.value === props.current ? "secondary" : "ghost"} {...props}>{children}</Button>;
}
