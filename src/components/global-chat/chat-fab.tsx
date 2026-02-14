"use client";

import { MessageCircle } from "lucide-react";
import { useGlobalChatStore } from "@/lib/stores/global-chat-store";

export function ChatFAB() {
  const toggle = useGlobalChatStore((s) => s.toggle);
  const isOpen = useGlobalChatStore((s) => s.isOpen);

  if (isOpen) return null;

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
      aria-label="KI-Lernassistent öffnen"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
