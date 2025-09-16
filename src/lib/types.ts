export type TemperatureData = {
  engine: number;
  oil: number;
  coolant: number;
  transmission: number;
};

export type FluidLevelsData = {
  oil: number;
  coolant: number;
  washer: number;
  brake: number;
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

export type Mode = 'maintenance' | 'audio' | 'satnav' | 'radio' | 'settings';
