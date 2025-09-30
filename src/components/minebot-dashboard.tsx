
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot, Loader2, Sparkles, Server, User, MessageSquare, Send } from "lucide-react";
import { triggerMessage } from "@/ai/flows/smart-message-trigger";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  fetchBotStatus,
  startMineBot,
  stopMineBot,
  sendChatMessageAction,
} from "@/app/actions/bot-actions";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type BotStatus = "online" | "offline" | "connecting";

export default function MineBotDashboard() {
  const [botStatus, setBotStatus] = useState<BotStatus>("offline");
  const [customMessages, setCustomMessages] = useState(
    "Welcome to the server!\nEnjoy your stay!\nDon't forget to read the rules."
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ message: string } | null>(
    null
  );
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Bot configuration state
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("25565");
  const [username, setUsername] = useState("MineBot");
  const [chatMessage, setChatMessage] = useState("Msg dev by Akshit");
  const [realtimeMessage, setRealtimeMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      // Don't poll if we are in the middle of a start/stop action
      if (isLoading) return;
      try {
        const { status } = await fetchBotStatus();
        setBotStatus(status);
      } catch (error) {
        console.error("Failed to fetch bot status:", error);
        setBotStatus("offline");
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleStartBot = async () => {
    setIsLoading(true);
    try {
      const portNumber = parseInt(port, 10);
      if (isNaN(portNumber)) {
        toast({
          variant: "destructive",
          title: "Invalid Port",
          description: "Port must be a number.",
        });
        setIsLoading(false);
        return;
      }

      const { status } = await startMineBot({
        host,
        port: portNumber,
        username,
        chatMessage,
      });
      setBotStatus(status);
      toast({
        title: "Bot Starting",
        description: `Attempting to connect to ${host}:${portNumber}...`,
      });
    } catch (error: any) {
      console.error("Failed to start bot:", error);
      toast({
        variant: "destructive",
        title: "Failed to Start Bot",
        description: error.message || "Could not start the bot. See console for details.",
      });
      setBotStatus('offline');
    }
    setIsLoading(false);
  };

  const handleStopBot = async () => {
    setIsLoading(true);
    try {
      const { status } = await stopMineBot();
      setBotStatus(status);
      toast({
        title: "Bot Stopped",
        description: "The bot has been disconnected.",
      });
    } catch (error) {
      console.error("Failed to stop bot:", error);
      toast({
        variant: "destructive",
        title: "Failed to Stop Bot",
        description: "Could not stop the bot. See console for details.",
      });
    }
    setIsLoading(false);
  };
  
  const handleSendMessage = async () => {
    if (!realtimeMessage.trim()) return;
    setIsSending(true);
    try {
      const { success, error } = await sendChatMessageAction(realtimeMessage);
      if (success) {
        toast({
          title: "Message Sent",
          description: `Sent: "${realtimeMessage}"`,
        });
        setRealtimeMessage("");
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Send Message",
          description: error || "Could not send the message.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while sending the message.",
      });
    }
    setIsSending(false);
  };

  const handleSimulateEvent = async () => {
    setIsSimulating(true);
    setAiResponse(null);
    try {
      const messages = customMessages.split("\n").filter((m) => m.trim() !== "");
      if (messages.length === 0) {
        toast({
          variant: "destructive",
          title: "No Messages Defined",
          description:
            "Please define at least one custom chat message before simulating the AI.",
        });
        setIsSimulating(false);
        return;
      }

      const result = await triggerMessage({
        eventDescription:
          'A new player named "Steve" has joined the server for the first time.',
        availableMessages: messages,
      });

      if (result.shouldSendMessage && result.messageContent) {
        setAiResponse({
          message: `Bot decided to say: "${result.messageContent}"`,
        });
      } else {
        setAiResponse({
          message:
            "Bot analyzed the event and decided not to send a message.",
        });
      }
    } catch (error) {
      console.error("AI simulation failed:", error);
      toast({
        variant: "destructive",
        title: "Simulation Failed",
        description:
          "Could not get a response from the AI. Please check the console for errors.",
      });
    }
    setIsSimulating(false);
  };

  const getStatusInfo = () => {
    switch (botStatus) {
      case "online":
        return { color: "text-[#00FF00]", dot: "bg-[#00FF00]", text: "Online" };
      case "offline":
        return { color: "text-[#FF0000]", dot: "bg-[#FF0000]", text: "Offline" };
      case "connecting":
        return {
          color: "text-primary",
          dot: "bg-primary animate-pulse",
          text: "Connecting...",
        };
    }
  };
  const statusInfo = getStatusInfo();
  const isBotActive = botStatus === 'online' || botStatus === 'connecting';

  return (
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-headline">
              <Bot className="text-primary" />
              MineBot Manager
            </CardTitle>
            <CardDescription className="mt-1">
              Start a persistent Minecraft bot. It will run 24/7 until stopped.
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2 rounded-full border bg-secondary px-3 py-1 self-start sm:self-center">
            <div
              className={`h-2.5 w-2.5 rounded-full transition-colors ${statusInfo.dot}`}
            />
            <span className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">Bot Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="host" className="flex items-center gap-2"><Server />Server Host</Label>
                    <Input id="host" value={host} onChange={e => setHost(e.target.value)} disabled={isBotActive} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="port" className="flex items-center gap-2"><Server />Server Port</Label>
                    <Input id="port" value={port} onChange={e => setPort(e.target.value)} disabled={isBotActive} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2"><User />Bot Username</Label>
                    <Input id="username" value={username} onChange={e => setUsername(e.target.value)} disabled={isBotActive} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="chatMessage" className="flex items-center gap-2"><MessageSquare />Periodic Message</Label>
                    <Input id="chatMessage" value={chatMessage} onChange={e => setChatMessage(e.target.value)} disabled={isBotActive} />
                </div>
            </div>
            {isBotActive ? (
            <Button
              onClick={handleStopBot}
              disabled={isLoading}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bot className="mr-2 h-4 w-4" />
              )}
              Stop Bot
            </Button>
          ) : (
            <Button onClick={handleStartBot} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bot className="mr-2 h-4 w-4" />
              )}
              Start Bot
            </Button>
          )}
        </div>
        
        <Separator />
        
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-semibold flex items-center gap-2"><Send />Real-Time Chat</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input 
              id="realtime-message" 
              placeholder="Type a message to send..." 
              value={realtimeMessage}
              onChange={e => setRealtimeMessage(e.target.value)}
              disabled={botStatus !== 'online'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={botStatus !== 'online' || isSending || !realtimeMessage.trim()}
              className="w-full sm:w-auto"
            >
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4 rounded-lg border p-4">
        <div className="space-y-1">
            <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            Smart Message Trigger
            </h3>
            <p className="text-sm text-muted-foreground">
            Test the bot's AI to see how it responds to in-game events. This is separate from the live bot.
            </p>
        </div>
            <div className="space-y-4">
            <Label htmlFor="custom-messages" className="font-semibold flex items-center gap-2">
            AI Simulation Messages
            </Label>
            <Textarea
            id="custom-messages"
            placeholder="Enter one chat message per line for the AI to choose from..."
            className="min-h-[120px] font-code text-sm"
            value={customMessages}
            onChange={(e) => setCustomMessages(e.target.value)}
            aria-label="Custom Chat Messages for AI Simulation"
            />
        </div>
        <Button onClick={handleSimulateEvent} disabled={isSimulating}>
            {isSimulating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
            <Sparkles className="mr-2 h-4 w-4" />
            )}
            Simulate 'Player Join' Event
        </Button>

        {(isSimulating || aiResponse) && (
            <div className="pt-4">
            <Separator className="mb-4" />
            {isSimulating ? (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI is thinking...</span>
                </div>
            ) : (
                aiResponse && (
                <div>
                    <p className="text-sm font-semibold mb-2 text-secondary-foreground">
                    AI Simulation Result:
                    </p>
                    <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
                    {aiResponse.message}
                    </blockquote>
                </div>
                )
            )}
            </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
}
