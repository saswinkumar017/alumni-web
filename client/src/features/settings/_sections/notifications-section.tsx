"use client";

// Section: NotificationsSection
// Rendering: Client
// Data: Props-only (receives preferences and callbacks from Feature)
// Interaction: Reactive (toggle switches)

import type { ChangeEvent } from "react";

export interface NotificationPreferences {
  emailNotifications: boolean;
  eventReminders: boolean;
  messageAlerts: boolean;
}

export interface NotificationsSectionProps {
  preferences?: NotificationPreferences;
  onChange?: (prefs: NotificationPreferences) => void;
}

const SECTION_TITLE = "Notifications";

export function NotificationsSection({ preferences, onChange }: NotificationsSectionProps) {
  function handleToggle(field: keyof NotificationPreferences) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.({
        ...(preferences ?? {
          emailNotifications: false,
          eventReminders: false,
          messageAlerts: false,
        }),
        [field]: e.target.checked,
      });
    };
  }

  return (
    <section aria-labelledby="notifications-heading" className="mt-8">
      <h2
        id="notifications-heading"
        className="text-lg font-semibold text-zinc-900"
      >
        {SECTION_TITLE}
      </h2>
      <div className="mt-4 space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            defaultChecked={preferences?.emailNotifications ?? true}
            onChange={handleToggle("emailNotifications")}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-700">Email notifications</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            defaultChecked={preferences?.eventReminders ?? true}
            onChange={handleToggle("eventReminders")}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-700">Event reminders</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            defaultChecked={preferences?.messageAlerts ?? true}
            onChange={handleToggle("messageAlerts")}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-700">Message alerts</span>
        </label>
      </div>
    </section>
  );
}
