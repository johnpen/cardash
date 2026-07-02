export type TemperatureData = {
  engine: { ok: boolean };
  oil: { ok: boolean };
  coolant: { ok: boolean };
  transmission: { ok: boolean };
};

export type FluidLevelsData = {
  oil: { ok: boolean };
  coolant: { ok: boolean };
  washer: { ok: boolean };
  brake: { ok: boolean };
};

export type ControlMessage = {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: string;
  seen: boolean;
};

export type ServiceDetails = {
  lastServiceDate: string;
  nextServiceDate: string;
  distanceToNextService: number;
  odometer: number;
  recommendedActions: string[];
};

export type TirePressure = {
  location: 'front_left' | 'front_right' | 'rear_left' | 'rear_right';
  pressure: number;
  targetPressure: number;
  ok: boolean;
};

export type LocationData = {
    latitude: number;
    longitude: number;
    heading?: number;
    zoom?: number;
};

export type CarMaintenanceData = {
  temperatures: TemperatureData;
  fluidLevels: FluidLevelsData;
  controlMessages: ControlMessage[];
  serviceDetails: ServiceDetails;
  tirePressures: TirePressure[];
  location: LocationData | null;
};

export type Mode = 'home' | 'services' | 'maintenance' | 'audio' | 'satnav' | 'radio' | 'settings' | 'webview';
export type Subs = 'mapUpdate' | 'concierge';
export type TTSEngine = 'off' | 'cartesia' | 'onnx';
