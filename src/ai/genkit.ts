import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Only initialize googleAI if API key is available
const plugins = process.env.GOOGLE_GENAI_API_KEY
  ? [googleAI()]
  : [];

export const ai = genkit({
  plugins,
  model: process.env.GOOGLE_GENAI_API_KEY
    ? 'googleai/gemini-2.5-flash'
    : undefined,
});
