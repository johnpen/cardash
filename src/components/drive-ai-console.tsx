'use client';

import { useState } from 'react';
import type { Mode, TTSEngine } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ConsoleNav } from '@/components/console-nav';
import { ChatPanel } from '@/components/chat/chat-panel';
import MaintenanceMode from '@/components/modes/maintenance-mode';
import ServicesMode from '@/components/modes/services-mode';
import AudioMode from '@/components/modes/audio-mode';
import SatNavMode from '@/components/modes/sat-nav-mode';
import RadioMode from '@/components/modes/radio-mode';
import SettingsMode from '@/components/modes/settings-mode';
import HomeMode from '@/components/modes/home-mode';
import WebViewMode from '@/components/modes/web-view-mode';
import { cn } from '@/lib/utils';
import { ChatProvider } from '@/contexts/chat-context';

const modeComponents: { mode: Mode, component: React.ComponentType<any> }[] = [
  { mode: 'home', component: HomeMode },
  { mode: 'services', component: ServicesMode },
  { mode: 'maintenance', component: MaintenanceMode },
  { mode: 'audio', component: AudioMode },
  { mode: 'satnav', component: SatNavMode },
  { mode: 'radio', component: RadioMode },
  { mode: 'settings', component: SettingsMode },
  { mode: 'webview', component: WebViewMode },
];

export function DriveAiConsole() {
  const [activeMode, setActiveMode] = useState<Mode>('home');
  const [webViewUrl, setWebViewUrl] = useState<string>('');
  const [ttsEngine, setTtsEngine] = useState<TTSEngine>('off');

  return (
    <Card className="w-full max-w-6xl h-[700px] max-h-[90vh] shadow-2xl bg-card/80 backdrop-blur-sm border-secondary flex flex-row overflow-hidden">
      <ConsoleNav activeMode={activeMode} setActiveMode={setActiveMode} />
      <ChatProvider setActiveMode={setActiveMode} setWebViewUrl={setWebViewUrl} ttsEngine={ttsEngine}>
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto relative">
          {modeComponents.map(({ mode, component: Component }) => (
            <div key={mode} className={cn('h-full w-full', activeMode === mode ? 'block' : 'hidden')}>
              <Component setActiveMode={setActiveMode} url={webViewUrl} ttsEngine={ttsEngine} setTtsEngine={setTtsEngine} />
            </div>
          ))}
          <ChatPanel />
        </div>
      </ChatProvider>
    </Card>
  );
}
