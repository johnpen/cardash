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
  { mode: 'services', label: 'Services', icon: Cog },
  { mode: 'maintenance', label: 'Maintenance', icon: Wrench },
  { mode: 'audio', label: 'Audio', icon: Music },
  { mode: 'satnav', label: 'Sat Nav', icon: MapPin },
  { mode: 'radio', label: 'Radio', icon: Radio },
  { mode: 'settings', label: 'Settings', icon: Settings },
];

export function ConsoleNav({ activeMode, setActiveMode }: ConsoleNavProps) {
  return (
    <nav className="flex items-center justify-center gap-2 sm:gap-4 p-2 bg-card/50 border-t">
      {navItems.map(({ mode, label, icon: Icon }) => (
        <Button
          key={mode}
          variant="ghost"
          size="lg"
          className={cn(
            'flex flex-col h-auto items-center gap-1 p-2 transition-colors duration-300',
            'text-muted-foreground hover:text-foreground',
            activeMode === mode && 'text-primary hover:text-primary'
          )}
          onClick={() => setActiveMode(mode)}
          aria-label={label}
        >
          <Icon className="h-6 w-6" />
          <span className="text-xs font-medium">{label}</span>
        </Button>
      ))}
    </nav>
  );
}
