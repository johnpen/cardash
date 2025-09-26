'use client';

import Image from 'next/image';
import { Music, MapPin, Radio, Settings, Wrench, Cog, ConciergeBell } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Subs } from '@/lib/types';
import exp from 'constants';

const sections: { subs: Subs; label: string; icon: React.ElementType, subexpires:string }[] = [
  { subs: 'mapUpdate', label: 'Map Updates', icon: MapPin, subexpires: '30 September 2025' },
  { subs: 'concierge', label: 'Concierge', icon: ConciergeBell, subexpires: '31 December 2026' },
];

export default function servicesMode() {
  return (
    <div className="flex flex-col items-center  h-full">
        <h1 className="text-4xl font-bold mb-8">Your Subscriptions</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {sections.map(({ subs, label, icon: Icon, subexpires }) => (
                <Card 
                    key={subs} 
                    className="p-4 sm:p-6 flex flex-col items-center justify-center gap-4 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                >
                    <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                    <span className="text-lg font-medium">{label}</span>
                    <span className="text-sm font-normal">Subscription Ends <br />{subexpires}</span>
                </Card>
            ))}
        </div>
    </div>
  );
}

