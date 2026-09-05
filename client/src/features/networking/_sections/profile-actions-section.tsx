"use client";

// Section: ProfileActionsSection
// Rendering: Client
// Data: Self-wired (calls connection-service using the profile's register number)
// Interaction: Active (connect/message actions)

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { sendConnectionRequestByRegister } from "../_services/connection-service";

export interface ProfileActionsSectionProps {
  profileId: string;
  isConnected?: boolean;
}

export function ProfileActionsSection({
  profileId,
  isConnected = false,
}: ProfileActionsSectionProps) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(isConnected);

  const handleConnect = async () => {
    if (connecting || connected) return;
    setConnecting(true);
    try {
      await sendConnectionRequestByRegister(profileId);
      setConnected(true);
      toast.success("Connection request sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <section aria-label="Profile actions" className="mt-4 flex gap-3">
      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting || connected}
        className={`rounded-lg px-4 py-2 text-sm font-medium ${
          connected
            ? "bg-surface-hover text-text-muted"
            : "bg-accent-solid text-accent-solid-foreground hover:bg-accent-solid-hover disabled:opacity-50"
        }`}
      >
        {connected ? "Request sent" : connecting ? "Sending..." : "Connect"}
      </button>
      <Link
        href="/alumni/messages"
        className="rounded-lg border border-border-input px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover"
      >
        Message
      </Link>
    </section>
  );
}
