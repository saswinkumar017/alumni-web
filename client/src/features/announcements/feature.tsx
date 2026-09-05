import type { SessionUser } from "@/types";

export function AnnouncementsPanel({ user: _user }: { user: SessionUser }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Announcements</h1>
      <p className="mt-2 text-zinc-600">
        Send broadcast announcements to alumni.
      </p>
    </div>
  );
}
