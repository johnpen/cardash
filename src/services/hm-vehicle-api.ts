'use server';
// You will need a valid VIN for a vehicle supported by the High Mobility API
const MOCK_VIN = "1HMFHT9P3AASCA56E";
import type { CarMaintenanceData } from '@/lib/types';
import fetch from 'node-fetch';

// A more realistic implementation of the High Mobility Vehicle API client.
// It now includes OAuth 2.0 Client Credentials Grant flow to get an access token.

// In-memory cache for the access token
let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

async function getAccessToken(): Promise<string> {
  console.info('getting  token');
  // If we have a valid token in cache, return it
  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const clientId = process.env.HM_CLIENT_ID;
  const clientSecret = process.env.HM_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'YOUR_CLIENT_ID') {
    console.warn('HM_CLIENT_ID or HM_CLIENT_SECRET are not set. Using mock data. Please add them to your .env file.');
    // Return a dummy token for mock mode
    return 'mock-token';
  }

  const tokenUrl = 'https://sandbox.api.high-mobility.com/v1/oauth/token';
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to get access token: ${response.statusText} - ${errorBody}`);
    }

    const tokenData = await response.json() as AccessTokenResponse;
    accessToken = tokenData.access_token;
    // Set expiry to 1 minute before it actually expires to be safe
    tokenExpiresAt = Date.now() + (tokenData.expires_in - 60) * 1000;

    console.info('Successfully fetched new HM access token.');
    return accessToken;
  } catch (error) {
    console.error(`Error fetching access token: ${error}`);
    throw new Error("Could not authenticate with Vehicle API.");
  }
}

async function getVehicleData(endpoint: string, vin: string, token: string) {
  // Use mock data if we're using a mock token.
  if (token === 'mock-token') {
    console.log(`MOCK API CALL: GET /${endpoint}`);
    switch (endpoint) {
      case 'maintenance':
        return {
          "odometer": { "value": 45210, "unit": "km", "timestamp": "2024-05-20T10:00:00Z" },
          "service_due_in": { "value": 15000, "unit": "km", "timestamp": "2024-05-20T10:00:00Z" }
        };
      case 'engine_oil':
        return {
          "level": { "value": 0.85, "timestamp": "2024-05-20T10:00:00Z" },
          "temperature": { "value": 95, "unit": "celsius", "timestamp": "2024-05-20T10:00:00Z" }
        };
      case 'engine_coolant':
        return {
          "level": { "value": 0.90, "timestamp": "2024-05-20T10:00:00Z" },
          "temperature": { "value": 85, "unit": "celsius", "timestamp": "2024-05-20T10:00:00Z" }
        };
      case 'fluid_levels':
        return {
          "washer_fluid_level": { "value": "low", "timestamp": "2024-05-20T10:00:00Z" },
          "brake_fluid_level": { "value": "full", "timestamp": "2024-05-20T10:00:00Z" }
        };
      case 'warnings':
        return {
          "warnings": [
            { "warning_id": "TPMS_FAULT", "description": "Tire pressure monitoring system fault.", "severity": "high", "timestamp": new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() }
          ]
        };
      default: return {};
    }
  }

  const apiUrl = `https://sandbox.api.high-mobility.com/v1/vehicle/${vin}/${endpoint}`;
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch vehicle data from ${endpoint}: ${response.statusText}`);
  }
  return response.json();
}


function createControlMessage(id: string, message: string, type: 'info' | 'warning' | 'error', timestamp: string): any {
  return { id, message, type, timestamp };
}

export const getCarMaintenanceData = async (): Promise<CarMaintenanceData> => {
  try {
    console.info('access token')
    const token = await getAccessToken();

    const [maintenance, engineOil, engineCoolant, fluidLevels, warnings] = await Promise.all([
      getVehicleData('maintenance', MOCK_VIN, token),
      getVehicleData('engine_oil', MOCK_VIN, token),
      getVehicleData('engine_coolant', MOCK_VIN, token),
      getVehicleData('fluid_levels', MOCK_VIN, token),
      getVehicleData('warnings', MOCK_VIN, token)
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

    console.info('Successfully fetched and mapped car maintenance data.');
    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch vehicle data: ${error}`);
    throw new Error("Could not connect to the Vehicle API.");
  }
};
