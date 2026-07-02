'use server';
/**
 * @fileOverview Summarizes car maintenance data from an API based on user specifications.
 *
 * - summarizeCarMaintenance - A function that takes a time range and returns a summary of the car's maintenance data.
 * - SummarizeCarMaintenanceInput - The input type for the summarizeCarMaintenance function.
 * - SummarizeCarMaintenanceOutput - The return type for the summarizeCarMaintenance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCarMaintenanceInputSchema = z.object({
  timeRange: z
    .string()
    .describe("The time range for the maintenance summary, e.g., 'last week', 'last month', or 'last year'."),
});
export type SummarizeCarMaintenanceInput = z.infer<typeof SummarizeCarMaintenanceInputSchema>;

const SummarizeCarMaintenanceOutputSchema = z.object({
  summary: z.string().describe('A summary of the car maintenance data for the specified time range.'),
});
export type SummarizeCarMaintenanceOutput = z.infer<typeof SummarizeCarMaintenanceOutputSchema>;

export async function summarizeCarMaintenance(input: SummarizeCarMaintenanceInput): Promise<SummarizeCarMaintenanceOutput> {
  return summarizeCarMaintenanceFlow(input);
}

const summarizeCarMaintenancePrompt = ai.definePrompt({
  name: 'summarizeCarMaintenancePrompt',
  input: {schema: SummarizeCarMaintenanceInputSchema},
  output: {schema: SummarizeCarMaintenanceOutputSchema},
  prompt: `You are an AI assistant summarizing car maintenance data.

  Summarize the car maintenance data for the following time range: {{{timeRange}}}.

  The summary should include information about:
  - Temperature readings
  - Fluid levels
  - Control messages
  - Service details.
  `,
});

const summarizeCarMaintenanceFlow = ai.defineFlow(
  {
    name: 'summarizeCarMaintenanceFlow',
    inputSchema: SummarizeCarMaintenanceInputSchema,
    outputSchema: SummarizeCarMaintenanceOutputSchema,
  },
  async input => {
    const {output} = await summarizeCarMaintenancePrompt(input);
    return output!;
  }
);
