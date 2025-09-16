'use server';

import { aiChatContextualHelp } from '@/ai/flows/ai-chat-contextual-help';
import { summarizeCarMaintenance } from '@/ai/flows/ai-chat-summarize-maintenance';
import { getCarMaintenanceData } from '@/services/hm-vehicle-api';
import { useLog } from '@/components/debug/log-context';

export async function getAiResponse(userQuery: string): Promise<string> {
  const { addLog } = useLog();
  try {
    addLog(`Getting AI response for query: "${userQuery}"`, 'info');
    const carData = await getCarMaintenanceData();
    const carStatusData = JSON.stringify(carData, null, 2);

    const result = await aiChatContextualHelp({
      carStatusData,
      userQuery,
    });
    addLog('Successfully received AI response.', 'info');
    return result.response;
  } catch (error: any) {
    addLog(`Error getting AI response: ${error.message}`, 'error');
    return 'Sorry, I encountered an error. Please try again.';
  }
}

export async function getAiSummary(timeRange: string): Promise<string> {
    const { addLog } = useLog();
  try {
    addLog(`Getting AI summary for time range: "${timeRange}"`, 'info');
    // Note: The new API doesn't support time ranges, so we'll just get the latest data.
    const result = await summarizeCarMaintenance({ timeRange });
    addLog('Successfully received AI summary.', 'info');
    return result.summary;
  } catch (error: any) {
    addLog(`Error getting AI summary: ${error.message}`, 'error');
    return 'Sorry, I could not generate a summary at this time.';
  }
}
