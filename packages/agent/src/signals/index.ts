import type { Signal, SignalData } from "./types.js";
import { gasSignal } from "./gas-signal.js";
import { timeSignal } from "./time-signal.js";
import { envioSignal } from "./envio-signal.js";

export const signalRegistry = new Map<string, Signal>([
  [gasSignal.name, gasSignal],
  [timeSignal.name, timeSignal],
  [envioSignal.name, envioSignal],
]);

export function getSignal(name: string): Signal | undefined {
  return signalRegistry.get(name);
}

export function getAllSignals(): Signal[] {
  return Array.from(signalRegistry.values());
}

export async function fetchAllSignals(): Promise<Record<string, SignalData>> {
  const signals: Record<string, SignalData> = {};

  for (const [name, signal] of signalRegistry) {
    try {
      signals[name] = await signal.fetch();
    } catch (error) {
      console.error(`Failed to fetch signal ${name}:`, error);
      signals[name] = { timestamp: new Date(), error: String(error) };
    }
  }

  return signals;
}

export * from "./types.js";
