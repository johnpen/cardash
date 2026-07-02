'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Home, Music, MapPin, Radio, Settings, Cog, Wrench} from 'lucide-react';
import type { Mode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ConsoleNavProps {
  activeMode: Mode;
  setActiveMode: Dispatch<SetStateAction<Mode>>;
}

const navItems: { mode: Mode; label: string; icon: React.ElementType }[] = [
  { mode: 'home', label: 'Home', icon: Home },
  { mode: 'satnav', label: 'Sat Nav', icon: MapPin },
  { mode: 'audio', label: 'Audio', icon: Music },
  { mode: 'maintenance', label: 'Maintenance', icon: Wrench },
  { mode: 'services', label: 'Services', icon: Cog },
  { mode: 'settings', label: 'Settings', icon: Settings },
];

export function ConsoleNav({ activeMode, setActiveMode }: ConsoleNavProps) {
  return (
    <nav className="flex flex-col items-center gap-2 p-4 bg-card/80 border-r h-full">
      {navItems.map(({ mode, label, icon: Icon }) => (
        <Button
          key={mode}
          variant="ghost"
          className={cn(
            'flex flex-col h-auto items-center justify-center p-3 rounded-lg w-20 h-20 transition-colors duration-200',
            'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            activeMode === mode && 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          onClick={() => setActiveMode(mode)}
          aria-label={label}
        >
          <Icon className="h-8 w-8" />
          <span className="text-xs font-medium mt-1">{label}</span>
        </Button>
      ))}
    </nav>
  );
}
