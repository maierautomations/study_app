import { create } from "zustand";

type PomodoroState = {
  isRunning: boolean;
  isPaused: boolean;
  secondsLeft: number;
  sessionDuration: number; // 25 min default
  completedSessions: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
  completeSession: () => void;
};

const DEFAULT_DURATION = 25 * 60; // 25 minutes

export const usePomodoroStore = create<PomodoroState>((set) => ({
  isRunning: false,
  isPaused: false,
  secondsLeft: DEFAULT_DURATION,
  sessionDuration: DEFAULT_DURATION,
  completedSessions: 0,
  start: () =>
    set({ isRunning: true, isPaused: false, secondsLeft: DEFAULT_DURATION }),
  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),
  reset: () =>
    set({
      isRunning: false,
      isPaused: false,
      secondsLeft: DEFAULT_DURATION,
    }),
  tick: () =>
    set((state) => {
      if (!state.isRunning || state.isPaused || state.secondsLeft <= 0)
        return state;
      return { secondsLeft: state.secondsLeft - 1 };
    }),
  completeSession: () =>
    set((state) => ({
      isRunning: false,
      isPaused: false,
      secondsLeft: DEFAULT_DURATION,
      completedSessions: state.completedSessions + 1,
    })),
}));
