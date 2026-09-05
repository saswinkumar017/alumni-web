"use client";

import { useEffect, useState } from "react";
import { env } from "@/config/env";
import { toast } from "sonner";
import Button from "@/components/ui/button";

const API = env.api.baseUrl;

export default function OtpSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [otpLength, setOtpLength] = useState("6");
  const [otpExpiry, setOtpExpiry] = useState("10");
  const [otpPurpose, setOtpPurpose] = useState("LOGIN_OTP");
  const [saving, setSaving] = useState(false);

  // OTP test
  const [testUsername, setTestUsername] = useState("developer");
  const [testOtp, setTestOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [testStatus, setTestStatus] = useState("");

  useEffect(() => {
    setLoading(false);
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      await fetch(`${API}/developer/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        body: JSON.stringify({ key: "otp.enabled", value: String(otpEnabled), valueType: "BOOLEAN", category: "SECURITY", description: "OTP verification enabled" }),
      });
      await fetch(`${API}/developer/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        body: JSON.stringify({ key: "otp.length", value: otpLength, valueType: "INTEGER", category: "SECURITY", description: "OTP code length" }),
      });
      await fetch(`${API}/developer/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        body: JSON.stringify({ key: "otp.expiry_minutes", value: otpExpiry, valueType: "INTEGER", category: "SECURITY", description: "OTP expiry in minutes" }),
      });
      toast.success("OTP settings saved");
    } catch { toast.error("Failed to save settings"); } finally { setSaving(false); }
  }

  async function sendTestOtp() {
    try {
      const res = await fetch(`${API}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: testUsername, purpose: otpPurpose }),
      });
      const data = await res.json();
      setSentOtp(data.otp ?? "");
      setTestStatus("OTP sent! Check the code above.");
      toast.success("Test OTP sent");
    } catch { toast.error("Failed to send OTP"); }
  }

  async function verifyTestOtp() {
    try {
      const res = await fetch(`${API}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: testUsername, otp: testOtp }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestStatus("OTP verified successfully!");
        toast.success("OTP verified");
      } else {
        setTestStatus(`Failed: ${data.error}`);
      }
    } catch { toast.error("Failed to verify OTP"); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">OTP Settings</h1>
        <p className="mt-1 text-sm text-zinc-600">Configure OTP verification and test the flow.</p>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Settings */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-bold text-zinc-900">OTP Configuration</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900">Enable OTP</p>
                  <p className="text-xs text-zinc-500">Require OTP verification for login</p>
                </div>
                <button
                  onClick={() => setOtpEnabled(!otpEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${otpEnabled ? "bg-green-600" : "bg-zinc-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${otpEnabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">OTP Length</label>
                  <select value={otpLength} onChange={(e) => setOtpLength(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
                    <option value="4">4 digits</option>
                    <option value="6">6 digits</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Expiry (minutes)</label>
                  <input type="number" value={otpExpiry} onChange={(e) => setOtpExpiry(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">OTP Purpose</label>
                <select value={otpPurpose} onChange={(e) => setOtpPurpose(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
                  <option value="LOGIN_OTP">Login Verification</option>
                  <option value="EMAIL_VERIFICATION">Email Verification</option>
                </select>
              </div>
              <Button variant="primary" size="sm" onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>

          {/* Test OTP */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-bold text-zinc-900">Test OTP Flow</h2>
            <p className="mt-1 text-xs text-zinc-500">Send a test OTP and verify it works.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Username</label>
                <input value={testUsername} onChange={(e) => setTestUsername(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
              </div>
              <Button variant="secondary" size="sm" onClick={sendTestOtp}>Send OTP</Button>
              {sentOtp && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-800">Generated OTP (dev only):</p>
                  <p className="mt-1 text-2xl font-bold tracking-widest text-amber-900">{sentOtp}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-600">Enter OTP</label>
                <input value={testOtp} onChange={(e) => setTestOtp(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" placeholder="Enter the OTP code" />
              </div>
              <Button variant="primary" size="sm" onClick={verifyTestOtp}>Verify OTP</Button>
              {testStatus && (
                <p className={`text-sm ${testStatus.includes("success") ? "text-green-600" : "text-zinc-500"}`}>{testStatus}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
