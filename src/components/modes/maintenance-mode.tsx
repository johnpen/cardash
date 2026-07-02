
'use client';

import { useEffect, useState, useCallback, useRef, image } from 'react';
import { Droplets, Gauge, MessageSquareWarning, Wrench, Thermometer, Info, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { CarMaintenanceData, ControlMessage, TirePressure } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getCarMaintenanceData } from '@/services/hm-vehicle-api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLog } from '@/components/debug/log-context';
import { cn } from '@/lib/utils';
import { useChat } from '@/contexts/chat-context';
import carimg from '@/app/car.png'

const messageIcons: Record<ControlMessage['type'], React.ReactNode> = {
    info: <Info className="text-blue-400 h-5 w-5" />,
    warning: <AlertTriangle className="text-yellow-400 h-5 w-5" />,
    error: <ShieldAlert className="text-red-500 h-5 w-5" />,
}




const StatusItem = ({ label, ok }: { label: string; ok: boolean }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium capitalize">{label}</span>
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
        <span className={cn("text-sm font-bold", ok ? 'text-green-500' : 'text-yellow-500')}>
            {ok ? 'OK' : 'Alert'}
        </span>
      </div>
    </div>
  );
  



const TirePressureDisplay = ({ pressures }: { pressures: TirePressure[] }) => {
    const getTire = (location: TirePressure['location']) => pressures.find(p => p.location === location);
  
    const Tire = ({ location }: { location: TirePressure['location'] }) => {
      const tire = getTire(location);
      if (!tire) return null;
      
      return (
        <div className={cn('text-center', !tire.ok && 'text-yellow-400')}>
          <div className="text-lg font-bold">{tire.pressure.toFixed(2)}</div>
          <div className="text-xs">({tire.targetPressure.toFixed(2)})</div>
        </div>
      );
    };
  
    return (
      <div className="relative flex justify-center items-center h-64">
        <img  src={carimg.src} alt={"Car"} width={"300"}/>
        <div className="absolute top-0" style={{left:'240px'}}>
          <Tire location="front_left" />
        </div>
        <div className="absolute top-0"  style={{right:'240px'}}>
          <Tire location="front_right" />
        </div>
        <div className="absolute bottom-0"  style={{left:'240px'}}>
          <Tire location="rear_left" />
        </div>
        <div className="absolute bottom-0"  style={{right:'240px'}}>
          <Tire location="rear_right" />
        </div>
      </div>
    );
  };


export default function MaintenanceMode() {
  const [data, setData] = useState<CarMaintenanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useLog();
  const { sendSystemMessage } = useChat();
  const isInitialLoad = useRef(true);

  const processNewMessages = useCallback((messages: ControlMessage[]) => {
      if (isInitialLoad.current) {
        messages.forEach(msg => msg.seen = true);
        isInitialLoad.current = false;
        return;
      }
      
      messages.forEach(msg => {
          if (!msg.seen && (msg.type === 'warning' || msg.type === 'error')) {
   //           addLog('New warning detected: ' + msg.message + '. Sending to agent.',  'info');
              const prompt = `A new vehicle alert has been triggered: "${msg.message}". Please explain what this problem is and advise if it is safe to continue driving.`;

              if(msg.message!=''){
               // sendSystemMessage(prompt, true);
              }
            msg.seen = true;
          }
      });
  }, [addLog]);

  const fetchData = useCallback(async () => {
    try {
      const maintenanceData = await getCarMaintenanceData();
      setData(maintenanceData);
      if (maintenanceData.controlMessages) {
        processNewMessages(maintenanceData.controlMessages);
      }
      setError(null);
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch maintenance data.';
      setError(errorMessage);
      addLog(`Failed to fetch maintenance data: ${errorMessage}`, 'error');
    }
  }, [addLog, processNewMessages]);

  useEffect(() => {
    fetchData(); // Fetch immediately on mount
    const intervalId = setInterval(fetchData, 5000); // Fetch every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [fetchData]);

  if (error && !data) {
    return <div className="flex items-center justify-center h-full text-destructive"><AlertTriangle className="h-16 w-16 mr-4" />{error}</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-full"><Gauge className="h-16 w-16 animate-pulse" /></div>;
  }

  const { temperatures, fluidLevels, controlMessages, serviceDetails, tirePressures } = data;

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Thermometer className="text-primary" /> Temperatures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 divide-y">
            {Object.entries(temperatures).map(([key, value]) => (
                <StatusItem key={key} label={key} ok={value.ok} />
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Droplets className="text-primary" /> Fluid Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 divide-y">
             {Object.entries(fluidLevels).map(([key, value]) => (
                <StatusItem key={key} label={key} ok={value.ok} />
            ))}
          </CardContent>
        </Card>
        


        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquareWarning className="text-primary" /> Control Messages</CardTitle>
          </CardHeader>
          <CardContent>
              <ul className="space-y-3">
                  {controlMessages.length === 1 && (
                    <li className="flex items-start gap-3 text-muted-foreground">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                        <div>
                            <p className="font-medium">All systems nominal</p>
                            <p className="text-xs">No warnings or errors to report.</p>
                        </div>
                    </li>
                  )}
                  {controlMessages.map(msg => (
                      <li key={msg.id} className="flex items-start gap-3">
                          <span className="mt-1">{messageIcons[msg.type]}</span>
                          <div>
                              <p className="font-medium">{msg.message}</p>
                              <p className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleString()}</p>
                          </div>
                      </li>
                  ))}
              </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="text-primary" /> Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
              {error && <p className="text-destructive text-sm font-medium">{error}</p>}
              <div className="flex justify-between">
                  <span className="font-medium">Odometer:</span>
                  <span>{serviceDetails.odometer.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between">
                  <span className="font-medium">Last Service:</span>
                  <span>{new Date(serviceDetails.lastServiceDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                  <span className="font-medium">Next Service:</span>
                  <span>{new Date(serviceDetails.nextServiceDate).toLocaleDateString()}</span>
              </div>
              <Separator />
              <div>
                  <h4 className="font-medium mb-2">Recommended Actions:</h4>
                  <ul className="space-y-2">
                      {serviceDetails.recommendedActions.map((action, i) => (
                          <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              <span>{action}</span>
                          </li>
                      ))}
                      {serviceDetails.recommendedActions.length === 0 && (
                        <li className="text-muted-foreground text-xs">None</li>
                      )}
                  </ul>
              </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/>
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                    <path d="M12 22a10 10 0 0 0 10-10"/>
                    <path d="M2 12a10 10 0 0 0 10 10"/>
                </svg>
                Tire Pressure
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tirePressures.length > 0 ? (
                <TirePressureDisplay pressures={tirePressures} />
            ) : (
                <p className="text-muted-foreground text-sm py-2 text-center">Tire pressure data not available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
