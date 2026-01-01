"use client";

import { useState } from "react";
import { DAY_NAMES, TIMEZONE_OPTIONS, type PolicyFormState } from "../types/policy";

interface AdvancedConditionsFormProps {
  value: PolicyFormState;
  onChange: (value: PolicyFormState) => void;
}

export function AdvancedConditionsForm({ value, onChange }: AdvancedConditionsFormProps) {
  const [enabledConditions, setEnabledConditions] = useState({
    timeWindow: !!(value.conditions?.timeWindow),
    gasLimit: !!(value.conditions?.signals?.gas),
    whitelist: !!(value.conditions?.recipients?.allowed),
    cooldown: !!(value.conditions?.cooldown),
  });

  const handleConditionToggle = (condition: keyof typeof enabledConditions) => {
    const newEnabled = { ...enabledConditions, [condition]: !enabledConditions[condition] };
    setEnabledConditions(newEnabled);

    // Remove condition from policy if disabled
    if (!newEnabled[condition]) {
      const newConditions = { ...value.conditions };

      if (condition === "timeWindow") {
        delete newConditions.timeWindow;
      } else if (condition === "gasLimit") {
        if (newConditions.signals) {
          delete newConditions.signals.gas;
          if (!newConditions.signals.security) {
            delete newConditions.signals;
          }
        }
      } else if (condition === "whitelist") {
        if (newConditions.recipients) {
          delete newConditions.recipients.allowed;
          if (!newConditions.recipients.blocked) {
            delete newConditions.recipients;
          }
        }
      } else if (condition === "cooldown") {
        delete newConditions.cooldown;
      }

      onChange({
        ...value,
        conditions: Object.keys(newConditions).length > 0 ? newConditions : undefined,
      });
    } else {
      // Initialize with default values when enabled
      const newConditions = { ...value.conditions };

      if (condition === "timeWindow") {
        newConditions.timeWindow = {
          days: [1, 2, 3, 4, 5], // Weekdays by default
          startHour: 9,
          endHour: 17,
          timezone: "America/New_York",
        };
      } else if (condition === "gasLimit") {
        if (!newConditions.signals) newConditions.signals = {};
        newConditions.signals.gas = { maxGwei: 50 };
      } else if (condition === "whitelist") {
        if (!newConditions.recipients) newConditions.recipients = {};
        newConditions.recipients.allowed = [];
      } else if (condition === "cooldown") {
        newConditions.cooldown = { seconds: 3600 };
      }

      onChange({ ...value, conditions: newConditions });
    }
  };

  const handleDayToggle = (day: number) => {
    if (!value.conditions?.timeWindow) return;

    const currentDays = value.conditions.timeWindow.days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);

    onChange({
      ...value,
      conditions: {
        ...value.conditions,
        timeWindow: { ...value.conditions.timeWindow, days: newDays },
      },
    });
  };

  const handleTimeChange = (field: "startHour" | "endHour", newValue: number) => {
    if (!value.conditions?.timeWindow) return;

    onChange({
      ...value,
      conditions: {
        ...value.conditions,
        timeWindow: { ...value.conditions.timeWindow, [field]: newValue },
      },
    });
  };

  const handleTimezoneChange = (timezone: string) => {
    onChange({
      ...value,
      conditions: {
        ...value.conditions!,
        timeWindow: { ...value.conditions!.timeWindow!, timezone },
      },
    });
  };

  const handleGasLimitChange = (maxGwei: number) => {
    if (!value.conditions) return;

    onChange({
      ...value,
      conditions: {
        ...value.conditions,
        signals: {
          ...value.conditions.signals,
          gas: { maxGwei },
        },
      },
    });
  };

  const handleWhitelistAdd = () => {
    const newAddress = prompt("Enter Ethereum address to whitelist:");
    if (!newAddress || !/^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
      alert("Invalid Ethereum address");
      return;
    }

    const current = value.conditions?.recipients?.allowed || [];
    onChange({
      ...value,
      conditions: {
        ...value.conditions!,
        recipients: {
          ...value.conditions!.recipients,
          allowed: [...current, newAddress],
        },
      },
    });
  };

  const handleWhitelistRemove = (address: string) => {
    const current = value.conditions?.recipients?.allowed || [];
    onChange({
      ...value,
      conditions: {
        ...value.conditions!,
        recipients: {
          ...value.conditions!.recipients,
          allowed: current.filter(a => a !== address),
        },
      },
    });
  };

  const handleCooldownChange = (seconds: number) => {
    if (!value.conditions) return;

    onChange({
      ...value,
      conditions: {
        ...value.conditions,
        cooldown: { seconds },
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Time Window Restrictions */}
      <div className="border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="enable-timewindow"
            checked={enabledConditions.timeWindow}
            onChange={() => handleConditionToggle("timeWindow")}
            className="w-4 h-4 rounded border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900 cursor-pointer"
          />
          <label htmlFor="enable-timewindow" className="text-sm font-medium cursor-pointer">
            Time window restrictions
          </label>
        </div>

        {enabledConditions.timeWindow && value.conditions?.timeWindow && (
          <div className="ml-6 space-y-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-2">Active Days</label>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => handleDayToggle(index)}
                    className={`px-3 py-1 text-xs rounded ${
                      value.conditions!.timeWindow!.days.includes(index)
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Start Hour (24h)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={value.conditions.timeWindow.startHour}
                  onChange={(e) => handleTimeChange("startHour", parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">End Hour (24h)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={value.conditions.timeWindow.endHour}
                  onChange={(e) => handleTimeChange("endHour", parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Timezone</label>
              <select
                value={value.conditions.timeWindow.timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm cursor-pointer"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Gas Price Limits */}
      <div className="border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="enable-gas"
            checked={enabledConditions.gasLimit}
            onChange={() => handleConditionToggle("gasLimit")}
            className="w-4 h-4 rounded border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900 cursor-pointer"
          />
          <label htmlFor="enable-gas" className="text-sm font-medium cursor-pointer">
            Gas price limits
          </label>
        </div>

        {enabledConditions.gasLimit && value.conditions?.signals?.gas && (
          <div className="ml-6">
            <label className="block text-xs text-zinc-400 mb-1">Maximum Gas Price (Gwei)</label>
            <input
              type="number"
              min="1"
              value={value.conditions.signals.gas.maxGwei || ""}
              onChange={(e) => handleGasLimitChange(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm"
              placeholder="50"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Transactions will be blocked if gas price exceeds this limit
            </p>
          </div>
        )}
      </div>

      {/* Recipient Whitelist */}
      <div className="border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="enable-whitelist"
            checked={enabledConditions.whitelist}
            onChange={() => handleConditionToggle("whitelist")}
            className="w-4 h-4 rounded border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900 cursor-pointer"
          />
          <label htmlFor="enable-whitelist" className="text-sm font-medium cursor-pointer">
            Recipient whitelist
          </label>
        </div>

        {enabledConditions.whitelist && value.conditions?.recipients && (
          <div className="ml-6 space-y-2">
            <button
              onClick={handleWhitelistAdd}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
            >
              + Add Address
            </button>

            {value.conditions.recipients.allowed && value.conditions.recipients.allowed.length > 0 ? (
              <div className="space-y-1">
                {value.conditions.recipients.allowed.map((addr) => (
                  <div
                    key={addr}
                    className="flex items-center justify-between p-2 bg-zinc-900 rounded text-xs"
                  >
                    <span className="font-mono">{addr}</span>
                    <button
                      onClick={() => handleWhitelistRemove(addr)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No whitelisted addresses yet</p>
            )}
          </div>
        )}
      </div>

      {/* Cooldown Period */}
      <div className="border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="enable-cooldown"
            checked={enabledConditions.cooldown}
            onChange={() => handleConditionToggle("cooldown")}
            className="w-4 h-4 rounded border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900 cursor-pointer"
          />
          <label htmlFor="enable-cooldown" className="text-sm font-medium cursor-pointer">
            Cooldown period
          </label>
        </div>

        {enabledConditions.cooldown && value.conditions?.cooldown && (
          <div className="ml-6">
            <label className="block text-xs text-zinc-400 mb-1">Cooldown Period (seconds)</label>
            <input
              type="number"
              min="60"
              step="60"
              value={value.conditions.cooldown.seconds || ""}
              onChange={(e) => handleCooldownChange(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm"
              placeholder="3600"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Minimum time between transactions (in seconds). 3600 = 1 hour
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
