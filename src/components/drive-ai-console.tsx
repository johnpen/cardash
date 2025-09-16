'use client';

import { useState } from 'react';
import type { Mode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ConsoleNav } from '@/components/console-nav';
import { ChatPanel } from '@/components/chat/chat-panel';
import MaintenanceMode from '@/components/modes/maintenance-mode';
import AudioMode from '@/components/modes/audio-mode';
import SatNavMode from '@/components/modes/sat-nav-mode';
import RadioMode from '@/components/modes/radio-mode';
import SettingsMode from '@/components/modes/settings-mode';

const modeComponents: Record<Mode, React.ComponentType> = {
  maintenance: MaintenanceMode,
  audio: AudioMode,
  satnav: SatNavMode,
  radio: RadioMode,
  settings: SettingsMode,
};

export function DriveAiConsole() {
  const [activeMode, setActiveMode] = useState<Mode>('maintenance');

  const ActiveComponent = modeComponents[activeMode];

  return (
    <Card className="w-full max-w-5xl h-[700px] max-h-[90vh] aspect-[4/3] shadow-2xl bg-card/80 backdrop-blur-sm border-secondary flex flex-col overflow-hidden">
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1">
        {ActiveComponent && <ActiveComponent />}
      </div>
      <ConsoleNav activeMode={activeMode} setActiveMode={setActiveMode} />
      <ChatPanel />
    </Card>
  );
}
