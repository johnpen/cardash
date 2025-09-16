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
};

export type ServiceDetails = {
  lastServiceDate: string;
  nextServiceDate: string;
  odometer: number;
  recommendedActions: string[];
};

export type CarMaintenanceData = {
  temperatures: TemperatureData;
  fluidLevels: FluidLevelsData;
  controlMessages: ControlMessage[];
  serviceDetails: ServiceDetails;
};

export type Mode = 'home' | 'maintenance' | 'audio' | 'satnav' | 'radio' | 'settings';
