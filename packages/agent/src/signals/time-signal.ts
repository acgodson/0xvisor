import type { Signal, SignalData } from "./types.js";

export const timeSignal: Signal = {
  name: "time",
  description: "Current time information",

  async fetch(): Promise<SignalData> {
    const now = new Date();
    return {
      timestamp: now,
      now: now.toISOString(),
      hour: now.getUTCHours(),
      dayOfWeek: now.getUTCDay(),
      dayOfMonth: now.getUTCDate(),
      month: now.getUTCMonth(),
      year: now.getUTCFullYear(),
      isWeekend: now.getUTCDay() === 0 || now.getUTCDay() === 6,
    };
  },
};
