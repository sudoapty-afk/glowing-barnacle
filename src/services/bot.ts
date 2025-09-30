'use server';
import mineflayer from 'mineflayer';
import type {Bot} from 'mineflayer';

export type BotStatus = 'online' | 'offline' | 'connecting';

export type BotOptions = {
  host: string;
  port: number;
  username: string;
  chatMessage: string;
};

let bot: Bot | null = null;
let status: BotStatus = 'offline';
let chatInterval: NodeJS.Timeout | null = null;
let botOptions: BotOptions | null = null;
let shouldReconnect = false;


export async function getBotStatus(): Promise<BotStatus> {
  return status;
}

function randomMove(botInstance: Bot) {
  const directions = ['forward', 'back', 'left', 'right'];
  const move = directions[Math.floor(Math.random() * directions.length)];
  botInstance.clearControlStates();
  botInstance.setControlState(move as any, true);
  setTimeout(() => botInstance.setControlState(move as any, false), 1000); // move for 1 sec
}

export async function sendChatMessage(message: string): Promise<{success: boolean, error?: string}> {
  if (status !== 'online' || !bot) {
    return { success: false, error: 'Bot is not online.' };
  }
  try {
    bot.chat(message);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send chat message:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}

export async function startBot(options: BotOptions): Promise<void> {
  if (bot || status === 'connecting') {
    console.log('Bot is already running or connecting.');
    return;
  }
  
  botOptions = options;
  shouldReconnect = true;
  await connect();
}

async function connect(): Promise<void> {
  if (!botOptions) {
    console.error('Bot options not set. Cannot connect.');
    status = 'offline';
    return;
  }
  
  status = 'connecting';
  console.log(`Attempting to connect bot to ${botOptions.host}:${botOptions.port}...`);

  try {
    const newBot = mineflayer.createBot({
      host: botOptions.host,
      port: botOptions.port,
      username: botOptions.username,
      auth: 'offline',
      checkTimeoutInterval: 60 * 1000,
    });
    
    bot = newBot; // Assign early to allow stopBot to work during connection attempt

    const cleanupAndReconnect = () => {
      if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
      }
      if(bot) {
        try {
            bot.quit();
        } catch (e) {
            console.log("Bot already quit.")
        }
      }
      bot = null;
      status = 'offline';
      
      if (shouldReconnect) {
          console.log('Bot disconnected. Reconnecting in 5 seconds...');
          setTimeout(connect, 5000);
      } else {
          console.log('Bot disconnected. Auto-reconnect is disabled.');
      }
    };

    newBot.on('spawn', () => {
      console.log('Bot has spawned!');
      status = 'online';
      if(botOptions?.chatMessage) {
        chatInterval = setInterval(() => {
          if (bot) {
            bot.chat(botOptions!.chatMessage);
            randomMove(bot);
          }
        }, 20000);
      }
    });

    newBot.on('error', err => {
      console.error('Mineflayer bot error:', err.message);
      if (err.message.includes('ECONNREFUSED')) {
        console.error(`Connection refused. Is the server running at ${botOptions?.host}:${botOptions?.port}?`);
      }
      cleanupAndReconnect();
    });

    newBot.on('end', reason => {
      console.log('Bot disconnected:', reason);
      cleanupAndReconnect();
    });

    newBot.on('kicked', (reason, loggedIn) => {
      console.log('Bot was kicked:', reason);
      cleanupAndReconnect();
    });

  } catch (error) {
    console.error('Failed to create bot:', error);
    status = 'offline';
    if (shouldReconnect) {
        console.log('Retrying in 5 seconds...');
        setTimeout(connect, 5000);
    }
  }
}

export async function stopBot(): Promise<void> {
    shouldReconnect = false;
    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }
    if (bot) {
        bot.quit();
        bot = null;
    }
    status = 'offline';
    console.log('Bot has been stopped manually.');
}
