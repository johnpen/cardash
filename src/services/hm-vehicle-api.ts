// You will need a valid VIN for a vehicle supported by the High Mobility API
const MOCK_VIN = "VIN_GOES_HERE";
import type { CarMaintenanceData } from '@/lib/types';

// A mock implementation of the High Mobility Vehicle API client.
// In a real application, you would use the High Mobility SDK or a fetch client.

async function getVehicleData(endpoint: string, vin: string, apiKey: string) {
  // This is a mock implementation. 
  // In a real scenario, you'd fetch from `https://api.high-mobility.com/v1/vehicle/${vin}/${endpoint}`
  // using the apiKey.
  
  // To keep this demo working without a real API key and VIN, we'll return some mock data
  // that resembles the API's response structure.

  console.log(`MOCK API CALL: GET /${endpoint}`);

  switch (endpoint) {
    case 'maintenance':
      return {
        "odometer": {
          "value": 45210,
          "unit": "km",
          "timestamp": "2024-05-20T10:00:00Z"
        },
        "service_due_in": {
          "value": 15000,
          "unit": "km",
          "timestamp": "2024-05-20T10:00:00Z"
        }
      };
    case 'engine_oil':
      return {
        "level": {
            "value": 0.85, // 85%
            "timestamp": "2024-05-20T10:00:00Z"
        },
        "temperature": {
            "value": 95,
            "unit": "celsius",
            "timestamp": "2024-05-20T10:00:00Z"
        }
      };
    case 'engine_coolant':
        return {
          "level": {
              "value": 0.90, // 90%
              "timestamp": "2024-05-20T10:00:00Z"
          },
          "temperature": {
              "value": 85,
              "unit": "celsius",
              "timestamp": "2024-05-20T10:00:00Z"
          }
        };
    case 'fluid_levels':
        return {
            "washer_fluid_level": {
                "value": "low", // This can be an enum
                "timestamp": "2024-05-20T10:00:00Z"
            },
            "brake_fluid_level": {
                "value": "full",
                "timestamp": "2024-05-20T10:00:00Z"
            }
        };
    case 'warnings':
        return {
            "warnings": [
                {
                    "warning_id": "TPMS_FAULT",
                    "description": "Tire pressure monitoring system fault.",
                    "severity": "high",
                    "timestamp": new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
                }
            ]
        }
    default:
      return {};
  }
}


function createControlMessage(id: string, message: string, type: 'info' | 'warning' | 'error', timestamp: string): any {
  return { id, message, type, timestamp };
}

export const getCarMaintenanceData = async (): Promise<CarMaintenanceData> => {
  const apiKey = process.env.HM_API_KEY;
  if (!apiKey) {
    throw new Error('HM_API_KEY is not set. Please add it to your .env file.');
  }

  try {
    const [maintenance, engineOil, engineCoolant, fluidLevels, warnings] = await Promise.all([
      getVehicleData('maintenance', MOCK_VIN, apiKey),
      getVehicleData('engine_oil', MOCK_VIN, apiKey),
      getVehicleData('engine_coolant', MOCK_VIN, apiKey),
      getVehicleData('fluid_levels', MOCK_VIN, apiKey),
      getVehicleData('warnings', MOCK_VIN, apiKey)
    ]);

    const controlMessages = [
        createControlMessage('info-1', 'All systems nominal.', 'info', new Date().toISOString())
    ];

    if (fluidLevels.washer_fluid_level.value === 'low') {
        controlMessages.push(createControlMessage('warning-1', 'Washer fluid low.', 'warning', fluidLevels.washer_fluid_level.timestamp));
    }

    warnings.warnings.forEach((w: any, i: number) => {
        controlMessages.push(createControlMessage(`error-${i+1}`, w.description, 'error', w.timestamp));
    });

    const nextServiceDate = new Date();
    nextServiceDate.setFullYear(nextServiceDate.getFullYear() + 1);

    const mappedData: CarMaintenanceData = {
      temperatures: {
        engine: 90, // Not in API, using mock
        oil: engineOil.temperature.value,
        coolant: engineCoolant.temperature.value,
        transmission: 75, // Not in API, using mock
      },
      fluidLevels: {
        oil: Math.round(engineOil.level.value * 100),
        coolant: Math.round(engineCoolant.level.value * 100),
        washer: fluidLevels.washer_fluid_level.value === 'low' ? 10 : 100,
        brake: fluidLevels.brake_fluid_level.value === 'full' ? 100 : 10,
      },
      controlMessages: controlMessages,
      serviceDetails: {
        lastServiceDate: '2023-11-15', // Not in API, using mock
        nextServiceDate: nextServiceDate.toISOString().split('T')[0],
        odometer: maintenance.odometer.value,
        recommendedActions: ['Check tire pressure', 'Rotate tires'], // Not in API, using mock
      },
    };

    return mappedData;
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
    throw new Error("Could not connect to the Vehicle API.");
  }
};
