"use client";

import { useCallback, useEffect, useState } from "react";
import { env } from "@/config/env";
import { toast } from "sonner";
import Button from "@/components/ui/button";

const API = env.api.baseUrl;

interface TemplateType {
  key: string;
  label: string;
}

interface TemplateData {
  type: string;
  defaultHtml: string;
  defaultSubject: string;
  variables: string[];
}

const TEMPLATE_LABELS: Record<string, string> = {
  ACCOUNT_VERIFICATION: "Account Verification",
  OTP_VERIFICATION: "OTP Verification Code",
  WELCOME: "Welcome Email",
  PASSWORD_RESET: "Password Reset",
  EMAIL_CORRECTION_APPROVED: "Email Correction Approved",
  EMAIL_CORRECTION_REJECTED: "Email Correction Rejected",
  NEW_ALUMNI_APPROVED: "New Alumni Approved",
  NEW_ALUMNI_REJECTED: "New Alumni Rejected",
};

export default function EmailTemplatesPage() {
  const [types, setTypes] = useState<TemplateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [editHtml, setEditHtml] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/developer/email-templates/types`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      const data = await res.json();
      setTypes(Object.entries(data).map(([key, label]) => ({ key, label: label as string })));
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  async function selectTemplate(type: string) {
    setSelectedType(type);
    try {
      const res = await fetch(`${API}/developer/email-templates/${type}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      const data = await res.json();
      setTemplateData(data);
      setEditHtml(data.defaultHtml ?? "");
      setEditSubject(data.defaultSubject ?? "");
    } catch { toast.error("Failed to load template"); }
  }

  async function saveTemplate() {
    if (!selectedType) return;
    setSaving(true);
    try {
      // Store in platform_config
      await fetch(`${API}/developer/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        body: JSON.stringify({
          key: `email_template.${selectedType.toLowerCase()}`,
          value: editHtml,
          valueType: "STRING",
          category: "EMAIL",
          description: `Email template for ${selectedType}`,
        }),
      });
      await fetch(`${API}/developer/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        body: JSON.stringify({
          key: `email_template.${selectedType.toLowerCase()}.subject`,
          value: editSubject,
          valueType: "STRING",
          category: "EMAIL",
          description: `Email subject for ${selectedType}`,
        }),
      });
      toast.success("Template saved");
    } catch { toast.error("Failed to save template"); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Email Templates</h1>
        <p className="mt-1 text-sm text-zinc-600">Manage email templates for notifications, verification, and requests.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Template list */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3">
            <p className="text-sm font-medium text-zinc-700">Templates</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-400">Loading...</p>
            ) : types.map((t) => (
              <button
                key={t.key}
                onClick={() => selectTemplate(t.key)}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-50 ${selectedType === t.key ? "bg-zinc-50 font-medium text-zinc-900" : "text-zinc-600"}`}
              >
                {TEMPLATE_LABELS[t.key] ?? t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template editor */}
        <div className="lg:col-span-2">
          {selectedType ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900">{TEMPLATE_LABELS[selectedType] ?? selectedType}</h2>
                <Button variant="primary" size="sm" onClick={saveTemplate} disabled={saving}>
                  {saving ? "Saving..." : "Save Template"}
                </Button>
              </div>

              {templateData && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-zinc-600">Available Variables:</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {templateData.variables.map((v) => (
                      <code key={v} className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{'{{' + v + '}}'}</code>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Email Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Email Body (HTML)</label>
                  <textarea
                    value={editHtml}
                    onChange={(e) => setEditHtml(e.target.value)}
                    rows={12}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs focus:border-zinc-500 focus:outline-none"
                  />
                </div>
                {editHtml && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">Preview</label>
                    <div className="mt-1 rounded-lg border border-zinc-200 p-4" dangerouslySetInnerHTML={{ __html: editHtml }} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-white">
              <p className="text-sm text-zinc-400">Select a template to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
