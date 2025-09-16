'use server';

import { aiChatContextualHelp } from '@/ai/flows/ai-chat-contextual-help';
import { summarizeCarMaintenance } from '@/ai/flows/ai-chat-summarize-maintenance';
import { getCarMaintenanceData } from '@/services/hm-vehicle-api';

export async function getAiResponse(userQuery: string): Promise<string> {
  try {
    console.log(`Getting AI response for query: "${userQuery}"`);
    const carData = await getCarMaintenanceData();
    const carStatusData = JSON.stringify(carData, null, 2);

    const result = await aiChatContextualHelp({
      carStatusData,
      userQuery,
    });
    console.log('Successfully received AI response.');
    return result.response;
  } catch (error: any) {
    console.error(`Error getting AI response: ${error.message}`);
    return 'Sorry, I encountered an error. Please try again.';
  }
}

export async function getAiSummary(timeRange: string): Promise<string> {
  try {
    console.log(`Getting AI summary for time range: "${timeRange}"`);
    // Note: The new API doesn't support time ranges, so we'll just get the latest data.
    const result = await summarizeCarMaintenance({ timeRange });
    console.log('Successfully received AI summary.');
    return result.summary;
  } catch (error: any) {
    console.error(`Error getting AI summary: ${error.message}`);
    return 'Sorry, I could not generate a summary at this time.';
  }
}
