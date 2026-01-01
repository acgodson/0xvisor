import type { PolicyRule, PolicyContext, PolicyResult } from "../types.js";

export const timeWindowRule: PolicyRule = {
  type: "time-window",
  name: "Time Window",
  description: "Only allow transactions during specific hours",
  defaultConfig: {
    startHour: 9,
    endHour: 17,
    daysOfWeek: [1, 2, 3, 4, 5],
    timezone: "UTC",
  },

  async evaluate(
    context: PolicyContext,
    config: Record<string, any>
  ): Promise<PolicyResult> {
    const {
      startHour = 9,
      endHour = 17,
      daysOfWeek = [1, 2, 3, 4, 5],
    } = config;
    const timeSignal = context.signals.time;

    const now = timeSignal?.now ? new Date(timeSignal.now) : new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay();

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (!daysOfWeek.includes(day)) {
      return {
        policyType: "time-window",
        policyName: "Time Window",
        allowed: false,
        reason: `Not a valid day: ${dayNames[day]} not in allowed days`,
        metadata: {
          currentDay: day,
          currentDayName: dayNames[day],
          allowedDays: daysOfWeek,
        },
      };
    }

    const inWindow =
      startHour <= endHour
        ? hour >= startHour && hour < endHour
        : hour >= startHour || hour < endHour;

    if (!inWindow) {
      return {
        policyType: "time-window",
        policyName: "Time Window",
        allowed: false,
        reason: `Outside time window: ${hour}:00 UTC not in ${startHour}:00-${endHour}:00`,
        metadata: { currentHour: hour, startHour, endHour },
      };
    }

    return {
      policyType: "time-window",
      policyName: "Time Window",
      allowed: true,
      reason: `Within time window: ${hour}:00 UTC`,
      metadata: { currentHour: hour, startHour, endHour },
    };
  },
};
