"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getConversations,
  getThread,
  sendMessage,
  markAsRead,
} from "./_services/message-service";
import type {
  ConversationSummary,
  ThreadMessage,
} from "./_services/message-service";
import type { SessionUser } from "@/types";

export function MessagesInbox({ user }: { user: SessionUser }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getConversations()
      .then((data) => {
        if (!active) return;
        setConversations(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load conversations");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSelect = useCallback(async (userId: number) => {
    setSelectedId(userId);
    setThreadLoading(true);
    try {
      const messages = await getThread(userId);
      setThread(messages);
      const unread = messages.filter((m) => !m.isRead && m.receiverId !== null);
      await Promise.allSettled(unread.map((m) => markAsRead(m.id)));
      setConversations((prev) =>
        prev.map((c) => (c.userId === userId ? { ...c, unreadCount: 0 } : c)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedId || sending) return;
    setSending(true);
    try {
      const sent = await sendMessage({ recipientId: selectedId, content: newMessage.trim() });
      setThread((prev) => [...prev, sent]);
      setNewMessage("");
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === selectedId
            ? { ...c, lastMessage: sent.body, lastMessageAt: sent.createdAt }
            : c,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Loading messages</span>
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-lg bg-zinc-100" />
          <div className="h-64 animate-pulse rounded-lg bg-zinc-100 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Messages</h1>
      <p className="mt-2 text-zinc-600">Your inbox and conversations.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <nav aria-label="Conversations" className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-zinc-700">Conversations</h2>
          {conversations.length === 0 ? (
            <p className="mt-2 rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
              No conversations yet. Start one from Networking.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200">
              {conversations.map((c) => (
                <li key={c.userId}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c.userId)}
                    aria-current={selectedId === c.userId}
                    className={`w-full p-3 text-left hover:bg-zinc-50 ${
                      selectedId === c.userId ? "bg-blue-50" : ""
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-900">{c.name}</span>
                      {c.unreadCount > 0 && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                          {c.unreadCount} unread
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 line-clamp-1 block text-xs text-zinc-500">{c.lastMessage}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
        <section aria-label="Conversation thread" className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-700">Thread</h2>
          <div className="mt-2 min-h-[240px] space-y-3 rounded-lg border border-zinc-200 p-4">
            {!selectedId ? (
              <p className="text-sm text-zinc-500">Select a conversation to view messages.</p>
            ) : threadLoading ? (
              <div className="space-y-3" aria-busy="true">
                <div className="h-12 w-2/3 animate-pulse rounded bg-zinc-100" />
                <div className="ml-auto h-12 w-1/2 animate-pulse rounded bg-zinc-100" />
              </div>
            ) : thread.length === 0 ? (
              <p className="text-sm text-zinc-500">No messages yet. Say hello.</p>
            ) : (
              thread.map((msg) => {
                const mine = user.id != null && Number(msg.senderId) === Number(user.id);
                return (
                  <div
                    key={msg.id}
                    className={`max-w-[80%] rounded-lg p-3 ${
                      mine ? "ml-auto bg-blue-600 text-white" : "bg-zinc-100 text-zinc-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">{msg.body}</p>
                    <p className={`mt-1 text-right text-xs ${mine ? "text-blue-200" : "text-zinc-400"}`}>
                      {new Date(msg.createdAt).toLocaleString()}
                      {mine && !msg.isRead ? " · Sent" : ""}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          {selectedId && (
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                aria-label="Type a message"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
