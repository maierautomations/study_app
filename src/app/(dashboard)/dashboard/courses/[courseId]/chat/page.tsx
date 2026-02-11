"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { trackActivity } from "@/lib/gamification-client";
import type { ChatMessage } from "@/types/database";
import type { UIMessage } from "ai";

export default function ChatPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const supabase = createClient();
  const [initialMessages, setInitialMessages] = useState<
    { id: string; role: "user" | "assistant"; content: string }[]
  >([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (data && data.length > 0) {
        setInitialMessages(
          data.map((m: ChatMessage) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        );
      }
      setLoaded(true);
    }
    loadHistory();
  }, [courseId, supabase]);

  if (!loaded) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ChatInterface courseId={courseId} initialMessages={initialMessages} />
  );
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function ChatInterface({
  courseId,
  initialMessages,
}: {
  courseId: string;
  initialMessages: { id: string; role: "user" | "assistant"; content: string }[];
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [input, setInput] = useState("");

  const uiInitialMessages = useMemo(
    () =>
      initialMessages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: m.content }],
      })),
    [initialMessages]
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { courseId },
      }),
    [courseId]
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: uiInitialMessages,
    onError: (err) => {
      toast.error("Chat-Fehler", { description: err.message });
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage({ text });
    trackActivity("chat_message", courseId);
  }

  async function clearHistory() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("chat_messages")
      .delete()
      .eq("course_id", courseId)
      .eq("user_id", user.id);

    toast.success("Chat-Verlauf gelöscht");
    window.location.reload();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/courses/${courseId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">KI-Chat</h1>
            <p className="text-xs text-muted-foreground">
              Stelle Fragen zu deinen Lernmaterialien
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory}>
            <Trash2 className="mr-2 h-4 w-4" />
            Verlauf löschen
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Hallo! Wie kann ich dir helfen?
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Ich kann dir Fragen zu deinen hochgeladenen Dokumenten beantworten.
              Stelle einfach eine Frage!
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {[
                "Erkläre die wichtigsten Konzepte",
                "Fasse das Dokument zusammen",
                "Was sind die Kernaussagen?",
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage({ text: suggestion })}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <Card
              className={`max-w-[80%] p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {getMessageText(message)}
              </div>
            </Card>
            {message.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <Card className="bg-muted p-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </Card>
          </div>
        )}

        {error && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <Bot className="h-4 w-4 text-destructive" />
            </div>
            <Card className="bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                Fehler: {error.message || "Etwas ist schiefgelaufen. Bitte versuche es erneut."}
              </p>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Stelle eine Frage zu deinen Unterlagen..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
