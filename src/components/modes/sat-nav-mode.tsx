'use client';

import Image from 'next/image';
import { Search, Navigation } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SatNavMode() {
  const mapImage = PlaceHolderImages.find(img => img.id === 'sat-nav-map');

  return (
    <div className="h-full w-full flex flex-col rounded-lg overflow-hidden relative">
      {mapImage && (
        <Image
          src={mapImage.imageUrl}
          alt={mapImage.description}
          layout="fill"
          objectFit="cover"
          className="z-0"
          data-ai-hint={mapImage.imageHint}
        />
      )}
      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Where to?" className="pl-10 h-12 text-lg" />
          <Button size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9">
            <Navigation className="h-5 w-5"/>
          </Button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <p className="text-muted-foreground text-sm">15 min</p>
                <h3 className="text-2xl font-bold">123 Main Street</h3>
                <p className="text-muted-foreground">8.5 km via City Bridge</p>
            </CardHeader>
            <CardFooter>
                <Button className="w-full" size="lg">End Trip</Button>
            </CardFooter>
          </Card>
      </div>
    </div>
  );
}
