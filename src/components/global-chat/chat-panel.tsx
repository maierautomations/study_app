"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X, Send, Bot, User, Loader2, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { trackActivity } from "@/lib/gamification-client";
import {
  useGlobalChatStore,
  type GlobalChatMessage,
} from "@/lib/stores/global-chat-store";

type CourseInfo = { id: string; name: string };

export function ChatPanel() {
  const isOpen = useGlobalChatStore((s) => s.isOpen);
  const setOpen = useGlobalChatStore((s) => s.setOpen);
  const messages = useGlobalChatStore((s) => s.messages);
  const addMessage = useGlobalChatStore((s) => s.addMessage);
  const updateLastAssistantMessage = useGlobalChatStore(
    (s) => s.updateLastAssistantMessage
  );
  const courseId = useGlobalChatStore((s) => s.courseId);
  const courseName = useGlobalChatStore((s) => s.courseName);
  const setCourseContext = useGlobalChatStore((s) => s.setCourseContext);
  const isLoading = useGlobalChatStore((s) => s.isLoading);
  const setLoading = useGlobalChatStore((s) => s.setLoading);
  const clearMessages = useGlobalChatStore((s) => s.clearMessages);

  const [input, setInput] = useState("");
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Detect course context from URL
  useEffect(() => {
    const match = pathname.match(/\/dashboard\/courses\/([^/]+)/);
    if (match) {
      const urlCourseId = match[1];
      // Only auto-set if not manually overridden
      const course = courses.find((c) => c.id === urlCourseId);
      if (course) {
        setCourseContext(course.id, course.name);
      }
    }
  }, [pathname, courses, setCourseContext]);

  // Fetch user courses
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses ?? []);
        }
      } catch {
        // Ignore
      }
    }
    if (isOpen && courses.length === 0) {
      fetchCourses();
    }
  }, [isOpen, courses.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = text ?? input.trim();
      if (!msg || isLoading) return;
      setInput("");

      const userMsg: GlobalChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: msg,
        timestamp: Date.now(),
      };
      addMessage(userMsg);

      // Add placeholder assistant message
      const assistantId = crypto.randomUUID();
      addMessage({
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      });
      setLoading(true);

      try {
        // Build messages for API (simplified format)
        const apiMessages = [
          ...messages.map((m) => ({
            role: m.role,
            parts: [{ type: "text" as const, text: m.content }],
          })),
          { role: "user" as const, parts: [{ type: "text" as const, text: msg }] },
        ];

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            courseId: courseId ?? undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Fehler" }));
          updateLastAssistantMessage(
            err.error || "Ein Fehler ist aufgetreten."
          );
          setLoading(false);
          return;
        }

        // Read streaming response
        const reader = res.body?.getReader();
        if (!reader) {
          updateLastAssistantMessage("Keine Antwort erhalten.");
          setLoading(false);
          return;
        }

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE data lines - extract text content
          const lines = chunk.split("\n");
          for (const line of lines) {
            // AI SDK sends data in format: "0:text" for text chunks
            if (line.startsWith("0:")) {
              try {
                const text = JSON.parse(line.slice(2));
                if (typeof text === "string") {
                  fullText += text;
                  updateLastAssistantMessage(fullText);
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }

        if (!fullText) {
          updateLastAssistantMessage(
            "Keine Antwort erhalten. Bitte versuche es erneut."
          );
        }

        trackActivity("chat_message", courseId ?? undefined);
      } catch {
        updateLastAssistantMessage("Verbindungsfehler. Bitte versuche es erneut.");
      } finally {
        setLoading(false);
      }
    },
    [
      input,
      isLoading,
      messages,
      courseId,
      addMessage,
      updateLastAssistantMessage,
      setLoading,
    ]
  );

  const quickActions = [
    { label: "Einfacher erklären", icon: "🔄" },
    { label: "Mehr Details", icon: "📖" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] flex flex-col bg-background border-l shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold">KI-Lernassistent</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {courseName ? `Kontext: ${courseName}` : "Alle Kurse"}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => setCourseContext(null, null)}
                >
                  Alle Kurse
                </DropdownMenuItem>
                {courses.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => setCourseContext(c.id, c.name)}
                  >
                    {c.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearMessages}
              title="Verlauf löschen"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">
              Frag mich alles zu deinen Unterlagen
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {courseName
                ? `Kontext: ${courseName}`
                : "Durchsucht alle deine Kurse"}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {[
                "Erkläre die wichtigsten Konzepte",
                "Fasse die Kernaussagen zusammen",
                "Was muss ich für die Prüfung wissen?",
              ].map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => handleSend(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, idx) => (
          <div key={message.id}>
            <div
              className={`flex gap-2.5 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "assistant" && message.content ? (
                  <MarkdownRenderer content={message.content} compact />
                ) : message.role === "assistant" && !message.content ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}

                {/* Source attribution */}
                {message.role === "assistant" &&
                  message.sources &&
                  message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                      {message.sources.map((src, i) => (
                        <Link
                          key={i}
                          href={`/dashboard/courses/${src.courseId}`}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => setOpen(false)}
                        >
                          <span>📄</span>
                          <span>
                            {src.documentName} ({src.courseName})
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
              </div>
              {message.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            {/* Quick actions after last assistant message */}
            {message.role === "assistant" &&
              message.content &&
              idx === messages.length - 1 &&
              !isLoading && (
                <div className="flex gap-1.5 mt-2 ml-9">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => handleSend(action.label)}
                    >
                      {action.icon} {action.label}
                    </Button>
                  ))}
                </div>
              )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Stelle eine Frage zu deinen Unterlagen..."
            disabled={isLoading}
            className="flex-1 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
