'use server';

/**
 * @fileOverview AI-powered goal suggestion flow.
 *
 * This flow suggests relevant goals based on the provided topic.
 * It uses the ai.generate function to get suggestions from a generative AI model.
 *
 * @exported
 * - `suggestGoals` -  The function that initiates the goal suggestion flow.
 * - `SuggestGoalsInput` - The input type for the suggestGoals function.
 * - `SuggestGoalsOutput` - The output type for the suggestGoals function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestGoalsInputSchema = z.object({
  topic: z.string().describe('The topic for which to suggest goals.'),
});
export type SuggestGoalsInput = z.infer<typeof SuggestGoalsInputSchema>;

const SuggestGoalsOutputSchema = z.object({
  goals: z.array(z.string()).describe('An array of suggested goals for the topic.'),
});
export type SuggestGoalsOutput = z.infer<typeof SuggestGoalsOutputSchema>;

export async function suggestGoals(input: SuggestGoalsInput): Promise<SuggestGoalsOutput> {
  return suggestGoalsFlow(input);
}

const suggestGoalsPrompt = ai.definePrompt({
  name: 'suggestGoalsPrompt',
  input: {schema: SuggestGoalsInputSchema},
  output: {schema: SuggestGoalsOutputSchema},
  prompt: `Suggest 3 achievable goals for the following topic:\n\n{{topic}}\n\nFormat your response as a JSON array of strings.  For example:\n[\"Goal 1\", \"Goal 2\", \"Goal 3\"]`,
});

const suggestGoalsFlow = ai.defineFlow(
  {
    name: 'suggestGoalsFlow',
    inputSchema: SuggestGoalsInputSchema,
    outputSchema: SuggestGoalsOutputSchema,
  },
  async input => {
    const {output} = await suggestGoalsPrompt(input);
    return output!;
  }
);
