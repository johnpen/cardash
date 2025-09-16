import type { CarMaintenanceData } from '@/lib/types';

export const getCarMaintenanceData = (): CarMaintenanceData => {
  return {
    temperatures: {
      engine: 90,
      oil: 95,
      coolant: 85,
      transmission: 75,
    },
    fluidLevels: {
      oil: 85,
      coolant: 90,
      washer: 60,
      brake: 95,
    },
    controlMessages: [
      { id: '1', message: 'All systems nominal.', type: 'info', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      { id: '2', message: 'Washer fluid low.', type: 'warning', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
      { id: '3', message: 'Tire pressure monitoring system fault.', type: 'error', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
    ],
    serviceDetails: {
      lastServiceDate: '2023-11-15',
      nextServiceDate: '2024-11-15',
      odometer: 45210,
      recommendedActions: ['Check tire pressure', 'Rotate tires'],
    },
  };
};
