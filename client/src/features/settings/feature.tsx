import type { SessionUser } from "@/types";
import { toast } from "sonner";
import { env } from "@/config/env";
import { AccountSection } from "./_sections/account-section";
import { NotificationsSection } from "./_sections/notifications-section";
import { SecuritySection } from "./_sections/security-section";
import { SystemConfigSection } from "./_sections/system-config-section";

const API = env.api.baseUrl;

async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await fetch(`${API}/profile/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Failed to change password");
  }
}

export function AlumniSettings({ user }: { user: SessionUser }) {
  async function handleChangePassword(currentPassword: string, newPassword: string) {
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
      <p className="mt-2 text-zinc-600">
        Manage your account settings and preferences.
      </p>
      <div className="mt-8 space-y-8">
        <AccountSection user={user} />
        <NotificationsSection />
        <SecuritySection onChangePassword={handleChangePassword} />
      </div>
    </div>
  );
}

export function AdminSettings({ user: _user }: { user: SessionUser }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
      <p className="mt-2 text-zinc-600">Application configuration.</p>
      <div className="mt-8 space-y-8">
        <SystemConfigSection />
        <SecuritySection />
      </div>
    </div>
  );
}
