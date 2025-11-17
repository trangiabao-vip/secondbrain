'use server';

/**
 * @fileOverview AI-powered topic suggestion flow.
 *
 * This flow suggests relevant topics based on user interests using generative AI.
 * It exports:
 * - `suggestTopics`: The function to trigger the topic suggestion flow.
 * - `TopicSuggestionInput`: The input type for the `suggestTopics` function.
 * - `TopicSuggestionOutput`: The output type for the `suggestTopics` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TopicSuggestionInputSchema = z.object({
  interests: z
    .array(z.string())
    .describe('A list of user interests to generate topics for.'),
});
export type TopicSuggestionInput = z.infer<typeof TopicSuggestionInputSchema>;

const TopicSuggestionOutputSchema = z.object({
  suggestedTopics: z
    .array(z.string())
    .describe('A list of suggested topics based on the user interests.'),
});
export type TopicSuggestionOutput = z.infer<typeof TopicSuggestionOutputSchema>;

export async function suggestTopics(input: TopicSuggestionInput): Promise<TopicSuggestionOutput> {
  return suggestTopicsFlow(input);
}

const topicSuggestionPrompt = ai.definePrompt({
  name: 'topicSuggestionPrompt',
  input: {schema: TopicSuggestionInputSchema},
  output: {schema: TopicSuggestionOutputSchema},
  prompt: `You are an AI topic suggestion tool. Based on the user's listed interests, suggest topics that the user might be interested in.

Interests: {{#each interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Suggested Topics:`,
});

const suggestTopicsFlow = ai.defineFlow(
  {
    name: 'suggestTopicsFlow',
    inputSchema: TopicSuggestionInputSchema,
    outputSchema: TopicSuggestionOutputSchema,
  },
  async input => {
    const {output} = await topicSuggestionPrompt(input);
    return output!;
  }
);
