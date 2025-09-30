'use server';

import {
  startBot,
  stopBot,
  getBotStatus,
  BotStatus,
  BotOptions,
  sendChatMessage
} from '@/services/bot';

export async function fetchBotStatus(): Promise<{status: BotStatus}> {
  return {status: await getBotStatus()};
}

export async function startMineBot(
  options: BotOptions
): Promise<{status: BotStatus}> {
  await startBot(options);
  return {status: await getBotStatus()};
}

export async function stopMineBot(): Promise<{status: BotStatus}> {
  await stopBot();
  return {status: await getBotStatus()};
}

export async function sendChatMessageAction(message: string): Promise<{success: boolean, error?: string}> {
    return sendChatMessage(message);
}
