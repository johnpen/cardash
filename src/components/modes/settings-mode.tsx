'use client';

import { Lightbulb, Lock, Sun, Volume2, Mic } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { TTSEngine } from '@/lib/types';

const settingsItems = [
    { id: 'ambient-light', label: 'Ambient Lighting', icon: Lightbulb },
    { id: 'auto-lock', label: 'Auto-Lock Doors', icon: Lock },
    { id: 'daytime-lights', label: 'Daytime Running Lights', icon: Sun },
];

interface SettingsModeProps {
    ttsEngine: TTSEngine;
    setTtsEngine: (engine: TTSEngine) => void;
}

export default function SettingsMode({ ttsEngine, setTtsEngine }: SettingsModeProps) {
  return (
    <div className="flex justify-center items-start h-full p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Car Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
            {settingsItems.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                    <Label htmlFor={item.id} className="flex items-center gap-3 text-lg">
                        <item.icon className="h-6 w-6 text-primary" />
                        <span>{item.label}</span>
                    </Label>
                    <Switch id={item.id} defaultChecked={item.id === 'daytime-lights'} />
                </div>
            ))}

            <div className="space-y-4">
                <Label className="flex items-center gap-3 text-lg">
                    <Volume2 className="h-6 w-6 text-primary" />
                    <span>System Volume</span>
                </Label>
                <Slider defaultValue={[50]} max={100} step={1} />
            </div>

            <div className="space-y-4">
                <Label className="flex items-center gap-3 text-lg">
                    <Sun className="h-6 w-6 text-primary" />
                    <span>Display Brightness</span>
                </Label>
                <Slider defaultValue={[80]} max={100} step={1} />
            </div>
            
            <div className="space-y-4">
                <Label className="flex items-center gap-3 text-lg">
                    <Mic className="h-6 w-6 text-primary" />
                    <span>Text-to-Speech Engine</span>
                </Label>
                 <RadioGroup
                    defaultValue="off"
                    value={ttsEngine}
                    onValueChange={(value: TTSEngine) => setTtsEngine(value)}
                    className="flex space-x-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cartesia" id="cartesia" />
                        <Label htmlFor="cartesia">Cartesia (Cloud)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="onnx" id="onnx" />
                        <Label htmlFor="onnx">ONNX (Local)</Label>
                    </div>
                    <div className="flex items-center space-x-2" >
                        <RadioGroupItem value="off" id="off" />
                        <Label htmlFor="off">Off</Label>
                    </div>
                </RadioGroup>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
