'use server';

import { aiChatContextualHelp } from '@/ai/flows/ai-chat-contextual-help';
import { summarizeCarMaintenance } from '@/ai/flows/ai-chat-summarize-maintenance';
import { getCarMaintenanceData } from '@/lib/mock-data';

export async function getAiResponse(userQuery: string): Promise<string> {
  try {
    const carData = getCarMaintenanceData();
    const carStatusData = JSON.stringify(carData, null, 2);

    const result = await aiChatContextualHelp({
      carStatusData,
      userQuery,
    });
    return result.response;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
}

export async function getAiSummary(timeRange: string): Promise<string> {
  try {
    const result = await summarizeCarMaintenance({ timeRange });
    return result.summary;
  } catch (error) {
    console.error('Error getting AI summary:', error);
    return 'Sorry, I could not generate a summary at this time.';
  }
}
