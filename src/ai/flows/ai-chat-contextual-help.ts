'use server';

/**
 * @fileOverview AI Chat Contextual Help flow.
 *
 * - aiChatContextualHelp - A function that provides helpful information about the car's status.
 * - AIChatContextualHelpInput - The input type for the aiChatContextualHelp function.
 * - AIChatContextualHelpOutput - The return type for the aiChatContextualHelp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatContextualHelpInputSchema = z.object({
  carStatusData: z
    .string()
    .describe(
      'Car status data fetched from the car maintenance API, including temperatures, levels, control messages, and service details.'
    ),
  userQuery: z.string().describe('The user query or message to the AI.'),
});
export type AIChatContextualHelpInput = z.infer<typeof AIChatContextualHelpInputSchema>;

const AIChatContextualHelpOutputSchema = z.object({
  response: z
    .string()
    .describe(
      'The AI response providing helpful information about the car status and potential issues based on the car maintenance API data and the user query.'
    ),
});
export type AIChatContextualHelpOutput = z.infer<typeof AIChatContextualHelpOutputSchema>;

export async function aiChatContextualHelp(input: AIChatContextualHelpInput): Promise<AIChatContextualHelpOutput> {
  return aiChatContextualHelpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiChatContextualHelpPrompt',
  input: {schema: AIChatContextualHelpInputSchema},
  output: {schema: AIChatContextualHelpOutputSchema},
  prompt: `You are a helpful AI assistant in a car, providing information to the driver about the car\'s status and potential issues.

  Use the following car status data to understand the current state of the car:
  {{carStatusData}}

  The driver has asked the following question or made the following statement:
  {{userQuery}}

  Provide a response that is helpful, informative, and relevant to the car\'s status and the driver\'s query. If the car status data indicates any potential issues, explain them clearly and suggest possible actions. Focus on providing information directly from the car status data. Format the data nicely.
  Assume the user is driving and give short precise responses.
  Avoid unnecessary conversational elements.
  `,
});

const aiChatContextualHelpFlow = ai.defineFlow(
  {
    name: 'aiChatContextualHelpFlow',
    inputSchema: AIChatContextualHelpInputSchema,
    outputSchema: AIChatContextualHelpOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
