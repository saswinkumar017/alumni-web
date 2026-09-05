"use client";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-bold text-zinc-900">Account Settings</h2>
        <p className="mt-1 text-sm text-zinc-500">Manage your admin account settings.</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600">Email Notifications</label>
            <p className="mt-1 text-sm text-zinc-500">Email notifications for new requests and approvals.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Session Timeout</label>
            <p className="mt-1 text-sm text-zinc-500">Auto-logout after inactivity period.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
