"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getCommunities,
  getCommunity,
  getCommunityMessages,
  postCommunityMessage,
  joinCommunity,
  leaveCommunity,
  createCommunity,
} from "./_services/community-service";
import { AlumniCard } from "@/components/ui";
import { Avatar } from "@/components/data-display";
import type { Community, CommunityMessage, CreateCommunityRequest } from "@/types/domain/community";

export function CommunityList() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateCommunityRequest>({
    name: "",
    description: "",
    batch: "",
    department: "",
    isPublic: true,
  });

  const PAGE_SIZE = 12;

  const load = useCallback(async () => {
    try {
      const result = await getCommunities();
      setCommunities(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load communities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter((c) =>
      [c.name, c.description, c.batch, c.department].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [communities, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const handleJoin = async (id: number) => {
    try {
      await joinCommunity(id);
      toast.success("Joined community!");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join");
    }
  };

  const handleLeave = async (id: number) => {
    try {
      await leaveCommunity(id);
      toast.success("Left community");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to leave");
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const created = await createCommunity({
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        batch: form.batch?.trim() || undefined,
        department: form.department?.trim() || undefined,
      });
      toast.success(`Community "${created.name}" created!`);
      setShowCreate(false);
      setForm({ name: "", description: "", batch: "", department: "", isPublic: true });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create community");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Community</h1>
          <p className="mt-2 text-text-secondary">Join communities and connect with fellow alumni.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-accent-solid px-4 py-2 text-sm font-medium text-accent-solid-foreground hover:bg-accent-solid-hover"
        >
          Create Community
        </button>
      </div>

      <div className="mt-6">
        <input
          type="text"
          placeholder="Search communities..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full rounded-lg border border-border-input bg-surface-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-surface-hover" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border-default p-8 text-center">
          <p className="text-sm text-text-muted">No communities found.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <AlumniCard
              key={c.id}
              name={c.name}
              description={c.description}
              subtitle={[c.department, c.batch].filter(Boolean).join(" · ") || undefined}
              badges={[{ label: `${c.memberCount} members` }]}
              href={`/alumni/community/${c.id}`}
              action={
                c.isMember ? (
                  <button
                    type="button"
                    onClick={() => handleLeave(c.id)}
                    className="w-full rounded-md bg-surface-hover px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-active"
                  >
                    Leave
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleJoin(c.id)}
                    className="w-full rounded-md bg-accent-solid px-3 py-1.5 text-xs font-medium text-accent-solid-foreground hover:bg-accent-solid-hover"
                  >
                    Join
                  </button>
                )
              }
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="rounded-md border border-border-input px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-text-secondary">Page {safePage + 1} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="rounded-md border border-border-input px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-text-primary">Create Community</h2>
            <p className="mt-1 text-sm text-text-muted">Start a new community for alumni to join.</p>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="community-name" className="block text-sm font-medium text-text-secondary">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  id="community-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. CSE Batch 2020"
                  className="mt-1 w-full rounded-lg border border-border-input bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="community-desc" className="block text-sm font-medium text-text-secondary">
                  Description
                </label>
                <textarea
                  id="community-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="What is this community about?"
                  className="mt-1 w-full rounded-lg border border-border-input bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="community-batch" className="block text-sm font-medium text-text-secondary">
                    Batch
                  </label>
                  <input
                    id="community-batch"
                    type="text"
                    value={form.batch ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
                    placeholder="e.g. 2020"
                    className="mt-1 w-full rounded-lg border border-border-input bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="community-dept" className="block text-sm font-medium text-text-secondary">
                    Department
                  </label>
                  <input
                    id="community-dept"
                    type="text"
                    value={form.department ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    placeholder="e.g. CSE"
                    className="mt-1 w-full rounded-lg border border-border-input bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublic ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                  className="h-4 w-4 rounded border-border-input text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-secondary">Public community</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="rounded-lg bg-surface-hover px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-active disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !form.name.trim()}
                className="rounded-lg bg-accent-solid px-4 py-2 text-sm font-medium text-accent-solid-foreground hover:bg-accent-solid-hover disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CommunityDetail({ communityId }: { communityId: number }) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, msgs] = await Promise.all([
        getCommunity(communityId),
        getCommunityMessages(communityId),
      ]);
      setCommunity(c);
      setMessages(msgs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load community");
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!community?.isMember) return;
    const interval = setInterval(() => {
      getCommunityMessages(communityId).then(setMessages).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [communityId, community?.isMember]);

  const handleJoinLeave = async () => {
    if (!community) return;
    try {
      if (community.isMember) {
        await leaveCommunity(community.id);
        toast.success("Left community");
      } else {
        await joinCommunity(community.id);
        toast.success("Joined community!");
      }
      const updated = await getCommunity(communityId);
      setCommunity(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handlePost = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const msg = await postCommunityMessage(communityId, { body: newMessage.trim() });
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-hover" />
        <div className="h-32 animate-pulse rounded-lg bg-surface-hover" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="rounded-lg border border-dashed border-border-default p-8 text-center">
        <p className="text-sm text-text-muted">Community not found.</p>
        <Link href="/alumni/community" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to communities
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/alumni/community" className="text-sm text-primary hover:underline">
        &larr; Back to communities
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{community.name}</h1>
          <p className="mt-1 text-sm text-text-muted">{community.memberCount} members</p>
        </div>
        <button
          type="button"
          onClick={handleJoinLeave}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            community.isMember
              ? "bg-surface-hover text-text-secondary hover:bg-surface-active"
              : "bg-accent-solid text-accent-solid-foreground hover:bg-accent-solid-hover"
          }`}
        >
          {community.isMember ? "Leave" : "Join"}
        </button>
      </div>

      {community.description && (
        <p className="mt-4 text-sm text-text-secondary">{community.description}</p>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">Discussion</h2>
        <div className="mt-4 space-y-4">
          {messages.length === 0 ? (
            <p className="text-sm text-text-muted">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-3 rounded-2xl border border-border-default p-4">
                <Avatar
                  src={msg.avatar}
                  alt={msg.displayName || "Alumni"}
                  fallback={(msg.displayName || "A").slice(0, 2).toUpperCase()}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{msg.displayName || "Alumni"}</span>
                    <span className="text-xs text-text-muted">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 break-words text-sm text-text-secondary">{msg.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {community.isMember && (
          <div className="mt-6 flex gap-2">
            <input
              type="text"
              placeholder="Write a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePost()}
              className="flex-1 rounded-lg border border-border-input bg-surface-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handlePost}
              disabled={sending || !newMessage.trim()}
              className="rounded-lg bg-accent-solid px-4 py-2.5 text-sm font-medium text-accent-solid-foreground hover:bg-accent-solid-hover disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
