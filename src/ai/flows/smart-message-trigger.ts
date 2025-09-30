'use server';

/**
 * @fileOverview This file defines a Genkit flow for intelligently triggering chat messages based on in-game events.
 *
 * It exports:
 * - `triggerMessage`: An async function to trigger a message based on the provided event.
 * - `SmartMessageTriggerInput`: The input type for the `triggerMessage` function, defining the event and available messages.
 * - `SmartMessageTriggerOutput`: The output type for the `triggerMessage` function, indicating whether a message should be sent and its content.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema for the smart message trigger flow
const SmartMessageTriggerInputSchema = z.object({
  eventDescription: z
    .string()
    .describe('Description of the in-game event that occurred.'),
  availableMessages: z
    .array(z.string())
    .describe('Array of predefined chat messages the bot can send.'),
});
export type SmartMessageTriggerInput = z.infer<
  typeof SmartMessageTriggerInputSchema
>;

// Output schema for the smart message trigger flow
const SmartMessageTriggerOutputSchema = z.object({
  shouldSendMessage: z
    .boolean()
    .describe('Whether a message should be sent in response to the event.'),
  messageContent: z
    .string()
    .optional()
    .describe('The content of the message to send, if any.'),
});
export type SmartMessageTriggerOutput = z.infer<
  typeof SmartMessageTriggerOutputSchema
>;

// Define the smart message trigger flow
export async function triggerMessage(
  input: SmartMessageTriggerInput
): Promise<SmartMessageTriggerOutput> {
  return smartMessageTriggerFlow(input);
}

const smartMessagePrompt = ai.definePrompt({
  name: 'smartMessagePrompt',
  input: {schema: SmartMessageTriggerInputSchema},
  output: {schema: SmartMessageTriggerOutputSchema},
  prompt: `You are a helpful Minecraft bot assistant.

  You are provided with a description of an in-game event and a list of available chat messages.
  Your task is to determine whether a message should be sent in response to the event.

  If a message should be sent, choose the most appropriate message from the list of available messages.
  If no message is appropriate, indicate that a message should not be sent.

  Here is the event description:
  {{eventDescription}}

  Here are the available messages:
  {{#each availableMessages}}
  - {{{this}}}
  {{/each}}

  Return a JSON object with 'shouldSendMessage' and 'messageContent' fields.  If no message should be sent, leave messageContent blank.
  Be sure to return valid JSON.  The output schema Zod descriptions are there to guide you.`,
});

const smartMessageTriggerFlow = ai.defineFlow(
  {
    name: 'smartMessageTriggerFlow',
    inputSchema: SmartMessageTriggerInputSchema,
    outputSchema: SmartMessageTriggerOutputSchema,
  },
  async input => {
    const {output} = await smartMessagePrompt(input);
    return output!;
  }
);
