import { describe, it, expect, beforeEach, vi } from "vitest";

const API_BASE = "http://localhost:8080/api";

beforeEach(() => {
  localStorage.setItem("accessToken", "test-token");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ content: [] }), { status: 200 })),
    ),
  );
});

function expectNoDoubleApi(url: string) {
  expect(url).toMatch(new RegExp(`^${API_BASE}`));
  expect(url).not.toContain("/api/api");
}

function lastFetchUrl(): string {
  const mock = fetch as unknown as ReturnType<typeof vi.fn>;
  const lastCall = mock.mock.calls.at(-1);
  return lastCall ? String(lastCall[0]) : "";
}

describe("API path contract (no double /api)", () => {
  it("community-service", async () => {
    const mod = await import("@/features/community/_services/community-service");
    await mod.getCommunities();
    expectNoDoubleApi(lastFetchUrl());
    await mod.getCommunity(1);
    expectNoDoubleApi(lastFetchUrl());
    await mod.joinCommunity(1);
    expectNoDoubleApi(lastFetchUrl());
    await mod.getCommunityMessages(1);
    expectNoDoubleApi(lastFetchUrl());
  });

  it("message-service", async () => {
    const mod = await import("@/features/messages/_services/message-service");
    await mod.getThread(1);
    expectNoDoubleApi(lastFetchUrl());
    await mod.markAsRead(1);
    expectNoDoubleApi(lastFetchUrl());
    await mod.deleteMessage(1);
    expectNoDoubleApi(lastFetchUrl());
  });

  it("connection-service", async () => {
    const mod = await import("@/features/networking/_services/connection-service");
    await mod.acceptConnection(1);
    expectNoDoubleApi(lastFetchUrl());
    await mod.rejectConnection(1);
    expectNoDoubleApi(lastFetchUrl());
    await mod.removeConnection(1);
    expectNoDoubleApi(lastFetchUrl());
  });

  it("donation-service", async () => {
    const mod = await import("@/features/donations/_services/donation-service");
    await mod.getDonation(1);
    expectNoDoubleApi(lastFetchUrl());
  });

  it("notification-service", async () => {
    const mod = await import("@/features/dashboard/_services/notification-service");
    await mod.markAsRead(1);
    expectNoDoubleApi(lastFetchUrl());
  });
});