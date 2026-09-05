"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getConnections,
  getPendingRequests,
  getSentRequests,
  getSuggestions,
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  removeConnection,
} from "../_services/connection-service";
import { AlumniCard } from "@/components/ui";
import type { Connection, ConnectionSuggestion } from "@/types/domain/connection";

type Tab = "connections" | "pending" | "sent" | "suggestions";

export function NetworkingListClient() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pending, setPending] = useState<Connection[]>([]);
  const [sent, setSent] = useState<Connection[]>([]);
  const [suggestions, setSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("connections");

  const load = useCallback(async () => {
    try {
      const [c, p, s, g] = await Promise.all([
        getConnections(),
        getPendingRequests(),
        getSentRequests(),
        getSuggestions(),
      ]);
      setConnections(c);
      setPending(p);
      setSent(s);
      setSuggestions(g);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load connections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = async (id: number) => {
    try {
      await acceptConnection(id);
      toast.success("Connection accepted!");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectConnection(id);
      toast.success("Connection rejected");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject");
    }
  };

  const handleCancelSent = async (id: number) => {
    try {
      await removeConnection(id);
      toast.success("Request withdrawn");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to withdraw");
    }
  };

  const handleConnect = async (s: ConnectionSuggestion) => {
    try {
      await sendConnectionRequest(s.id);
      toast.success(`Connection request sent to ${s.name}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send request");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-hover" />
        <div className="h-64 animate-pulse rounded-lg bg-surface-hover" />
      </div>
    );
  }

  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: "connections", label: "Connections", count: connections.length },
    { key: "pending", label: "Pending", count: pending.length },
    { key: "sent", label: "Sent", count: sent.length },
    { key: "suggestions", label: "Suggestions", count: suggestions.length },
  ];

  const statusLabel: Record<ConnectionSuggestion["connectionStatus"], string> = {
    CONNECTED: "Connected",
    PENDING_SENT: "Requested",
    PENDING_RECEIVED: "Request received",
    NONE: "Connect",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Networking</h1>
      <p className="mt-2 text-text-secondary">Connect with fellow alumni.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            type="button"
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              tab === t.key ? "bg-accent-solid text-accent-solid-foreground" : "bg-surface-hover text-text-secondary hover:bg-surface-active"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "connections" && (
          <>
            {connections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-default p-8 text-center">
                <p className="text-sm text-text-muted">No connections yet. Start networking!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {connections.map((c) => (
                  <AlumniCard
                    key={c.id}
                    name={c.recipientName}
                    avatarSrc={c.recipientAvatar}
                    subtitle={c.recipientRegisterNumber ? `Reg. ${c.recipientRegisterNumber}` : undefined}
                    badges={[
                      { label: "Connected", tone: "success" },
                      { label: new Date(c.createdAt).toLocaleDateString() },
                    ]}
                    href={`/alumni/networking/${c.recipientRegisterNumber ?? c.recipientId}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
        {tab === "pending" && (
          <>
            {pending.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-default p-8 text-center">
                <p className="text-sm text-text-muted">No pending requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-2xl border border-border-default bg-surface-card p-4 shadow-sm">
                    <div>
                      <Link
                        href={`/alumni/networking/${p.requesterRegisterNumber ?? p.requesterId}`}
                        className="text-sm font-medium text-text-primary hover:text-primary"
                      >
                        {p.requesterName}
                      </Link>
                      {p.message && <p className="mt-1 text-xs text-text-muted">{p.message}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAccept(p.id)}
                        className="rounded-md bg-accent-solid px-3 py-1.5 text-xs font-medium text-accent-solid-foreground hover:bg-accent-solid-hover"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(p.id)}
                        className="rounded-md bg-surface-hover px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-active"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {tab === "sent" && (
          <>
            {sent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-default p-8 text-center">
                <p className="text-sm text-text-muted">No sent requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sent.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-2xl border border-border-default bg-surface-card p-4 shadow-sm">
                    <div>
                      <Link
                        href={`/alumni/networking/${s.recipientRegisterNumber ?? s.recipientId}`}
                        className="text-sm font-medium text-text-primary hover:text-primary"
                      >
                        {s.recipientName}
                      </Link>
                      {s.message && <p className="mt-1 text-xs text-text-muted">{s.message}</p>}
                      <p className="mt-1 text-xs text-text-muted">Requested {new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancelSent(s.id)}
                      className="rounded-md bg-surface-hover px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-active"
                    >
                      Withdraw
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {tab === "suggestions" && (
          <>
            {suggestions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-default p-8 text-center">
                <p className="text-sm text-text-muted">No suggestions in your batch yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((s) => (
                  <AlumniCard
                    key={s.id}
                    name={s.name}
                    subtitle={
                      [s.department, s.batch].filter(Boolean).join(" · ") || undefined
                    }
                    badges={[
                      ...[s.designation, s.company].filter((label): label is string => Boolean(label)).map((label) => ({ label })),
                      { label: statusLabel[s.connectionStatus], tone: s.connectionStatus === "NONE" ? "warning" : "success" },
                    ]}
                    href={`/alumni/networking/${s.registerNumber}`}
                    action={
                      <button
                        type="button"
                        onClick={() => handleConnect(s)}
                        disabled={s.connectionStatus !== "NONE"}
                        className={`w-full rounded-md px-3 py-1.5 text-xs font-medium ${
                          s.connectionStatus === "NONE"
                            ? "bg-accent-solid text-accent-solid-foreground hover:bg-accent-solid-hover"
                            : "bg-surface-hover text-text-muted"
                        }`}
                      >
                        {statusLabel[s.connectionStatus]}
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
