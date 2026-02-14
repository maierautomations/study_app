import { create } from "zustand";

export type GlobalChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { documentName: string; courseId: string; courseName: string }[];
  timestamp: number;
};

type GlobalChatState = {
  isOpen: boolean;
  messages: GlobalChatMessage[];
  courseId: string | null;
  courseName: string | null;
  isLoading: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  addMessage: (message: GlobalChatMessage) => void;
  updateLastAssistantMessage: (content: string, sources?: GlobalChatMessage["sources"]) => void;
  setCourseContext: (courseId: string | null, courseName: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
};

export const useGlobalChatStore = create<GlobalChatState>((set) => ({
  isOpen: false,
  messages: [],
  courseId: null,
  courseName: null,
  isLoading: false,
  setOpen: (open) => set({ isOpen: open }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  updateLastAssistantMessage: (content, sources) =>
    set((s) => {
      const msgs = [...s.messages];
      const lastIdx = msgs.findLastIndex((m) => m.role === "assistant");
      if (lastIdx >= 0) {
        msgs[lastIdx] = { ...msgs[lastIdx], content, sources: sources ?? msgs[lastIdx].sources };
      }
      return { messages: msgs };
    }),
  setCourseContext: (courseId, courseName) => set({ courseId, courseName }),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [] }),
}));
