'use server';

import type {CarMaintenanceData, ControlMessage} from '@/lib/types';
import fetch from 'node-fetch';

// You will need a valid VIN for a vehicle supported by the High Mobility API
const MOCK_VIN = '1HMFHT9P3AASCA56E';

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
  // If we have a valid token in cache, return it
  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const clientId = process.env.HM_CLIENT_ID;
  const clientSecret = process.env.HM_CLIENT_SECRET;

  if (
    !clientId ||
    !clientSecret ||
    clientId === 'YOUR_CLIENT_ID' ||
    clientSecret === 'YOUR_CLIENT_SECRET'
  ) {
    throw new Error('HM_CLIENT_ID and HM_CLIENT_SECRET must be set in your .env file.');
  } 

  const tokenUrl = 'https://sandbox.api.high-mobility.com/v1/access_tokens';

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: `${clientId}`,
        client_secret: `${clientSecret}`,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Failed to get access token: ${response.statusText} - ${errorBody}`
      );
      throw new Error(
        `Could not authenticate with Vehicle API. Status: ${response.status}. Body: ${errorBody}`
      );
    }

    const tokenData = (await response.json()) as AccessTokenResponse;
    accessToken = tokenData.access_token;
    // Set expiry to 1 minute before it actually expires to be safe
    tokenExpiresAt = Date.now() + (tokenData.expires_in - 60) * 1000;

    console.info('Successfully fetched new HM access token.');
    return accessToken;
  } catch (error) {
    console.error(`Error fetching access token: ${error}`);
    // Re-throw the specific error from the try block or a generic one if it's a network error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Could not authenticate with Vehicle API due to a network issue.');
  }
}

async function getVehicleData(vin: string, token: string) {
  const apiUrl = `https://sandbox.api.high-mobility.com/v1/vehicle-data/autoapi-13/${vin}`;
  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch vehicle data: ${response.statusText}`
    );
  }
  
  return response.json();
}

function createControlMessage(
  id: string,
  message: string,
  type: 'info' | 'warning' | 'error',
  timestamp: string
): ControlMessage {
  return {id, message, type, timestamp};
}

function isLightOn(vehicleData: any, lightName: string): boolean {
    const light = vehicleData.dashboard_lights?.dashboard_lights.find((l:any) => l.data.name === lightName);
    return light?.data.state === 'on';
}

export const getCarMaintenanceData = async (): Promise<CarMaintenanceData> => {
  try {
    const token = await getAccessToken();
    const vehicleData: any = await getVehicleData(MOCK_VIN, token);

    const controlMessages: ControlMessage[] = [
      createControlMessage(
        'info-1',
        'All systems nominal.',
        'info',
        new Date().toISOString()
      ),
    ];

    if (vehicleData.dashboard_lights) {
        vehicleData.dashboard_lights.dashboard_lights
            .filter((light: any) => light.data.state === 'on')
            .forEach((light: any, index: number) => {
                controlMessages.push(createControlMessage(
                    `warning-${index + 1}`,
                    light.data.name.replace(/_/g, ' '),
                    'warning',
                    light.timestamp
                ));
            });
    }

    if (vehicleData.diagnostics && vehicleData.diagnostics.check_control_messages) {
        vehicleData.diagnostics.check_control_messages.forEach((msg: any, index: number) => {
            controlMessages.push(createControlMessage(
                `error-${index + 1}`,
                msg.data.text,
                'error',
                msg.timestamp
            ));
        });
    }


    const nextServiceDate = new Date();
    nextServiceDate.setFullYear(nextServiceDate.getFullYear() + 1);

    const mappedData: CarMaintenanceData = {
      temperatures: {
        engine: { ok: !isLightOn(vehicleData, 'engine_coolant_temperature') },
        oil: { ok: !isLightOn(vehicleData, 'engine_oil') },
        coolant: { ok: !isLightOn(vehicleData, 'engine_coolant_level') },
        transmission: { ok: !isLightOn(vehicleData, 'transmission_fluid_temperature') },
      },
      fluidLevels: {
        oil: { ok: !isLightOn(vehicleData, 'engine_oil_level') },
        coolant: { ok: !isLightOn(vehicleData, 'engine_coolant_level') },
        washer: { ok: !isLightOn(vehicleData, 'windscreen_washer_fluid') },
        brake: { ok: !isLightOn(vehicleData, 'brake_fluid_warning') },
      },
      controlMessages: controlMessages.slice(0, 5), // Limit messages to avoid overflow
      serviceDetails: {
        lastServiceDate: '2023-11-15', // Mocked
        nextServiceDate: vehicleData.maintenance?.drive_in_inspection_time_to?.timestamp || nextServiceDate.toISOString().split('T')[0],
        odometer: vehicleData.diagnostics?.odometer?.data?.value || 0,
        recommendedActions: ['Check tire pressure', 'Rotate tires'], // Mocked
      },
    };

    console.info('Successfully fetched and mapped car maintenance data from new endpoint.');
    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch vehicle data: ${error}`);
    if (error instanceof Error) {
      // Pass the more specific error message to the UI
      throw new Error(error.message);
    }
    throw new Error('Could not connect to the Vehicle API.');
  }
};
