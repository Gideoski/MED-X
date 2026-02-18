"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User } from "lucide-react";
import { askHelpBot } from "@/lib/actions";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "bot";
  text: string;
}

export function HelpBot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hello! I'm MED-X Bot. How can I help you with the platform or your studies today?" }
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector("div[data-radix-scroll-area-viewport]");
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    startTransition(async () => {
      const botResponse = await askHelpBot(input);
      const botMessage: Message = { role: "bot", text: botResponse };
      setMessages(prev => [...prev, botMessage]);
    });
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>AI Help Bot</CardTitle>
        <CardDescription>Get instant answers to your questions.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "bot" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-xs rounded-lg px-4 py-2 md:max-w-md",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.text}
                </div>
                 {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isPending && (
                <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                    <div className="max-w-xs rounded-lg px-4 py-2 md:max-w-md bg-muted flex items-center">
                        <span className="h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></span>
                        <span className="h-2 w-2 bg-foreground rounded-full animate-bounce"></span>
                    </div>
                </div>
             )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isPending}
          />
          <Button type="submit" size="icon" disabled={isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
