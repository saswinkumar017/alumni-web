"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  { q: "How do I register on the Alumni Portal?", a: "Click 'Register' on the login page, enter your register number and email (must match our records), choose a username and password, then verify via the OTP sent to your email." },
  { q: "I didn't receive the OTP. What should I do?", a: "Check your spam/junk folder. If still not found, click 'Resend' on the verification screen. The OTP expires after 10 minutes." },
  { q: "How do I update my profile information?", a: "Log in to your account, go to Profile from the sidebar, edit your phone, address, or employment details, and click Save." },
  { q: "How do I connect with other alumni?", a: "Go to Networking from the sidebar. You can view your connections, see pending requests, and accept or reject connection requests from other alumni." },
  { q: "How do I join a community?", a: "Navigate to Community from the sidebar, browse available communities by batch or department, and click Join on any community you want to be part of." },
  { q: "How do I send a message to another alumni?", a: "Go to Messages from the sidebar, click Compose, select the recipient, write your message, and send." },
  { q: "How do I make a donation?", a: "Navigate to Donations from the sidebar, fill in the amount, purpose, and notes, then submit. Your donation will be recorded in your history." },
  { q: "My email is wrong in the system. How do I fix it?", a: "Go to the Directory page, find your record, and click 'Request Update'. Submit a correction request with your new email. An admin will review and approve it." },
  { q: "I can't find my record in the directory. What should I do?", a: "Click the '+ Add Alumni' button on the Directory page or the 'Request to Add Alumni' button in the empty state. Fill in your details and submit. An admin will review your request." },
  { q: "How do I change my password?", a: "Go to Settings from the sidebar, scroll to the Security section, enter your current and new password, and click 'Update Password'." },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Frequently Asked Questions</h1>
      <p className="mt-4 text-lg text-zinc-600">Find answers to common questions about the Alumni Portal.</p>

      <div className="mt-8 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              <span>{item.q}</span>
              <svg className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform ${openIndex === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === i && (
              <div className="px-6 pb-4 text-sm text-zinc-600 leading-relaxed">{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
