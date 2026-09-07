"use client";

import { useState } from "react";

const DEPARTMENTS = [
  "Artificial Intelligence & Data Science",
  "Computer Science Engineering (Cyber Security)",
  "Computer Science Engineering",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electrical and Electronics Engineering",
  "Aeronautical Engineering",
  "Civil Engineering",
  "Mechanical Engineering",
  "Computer Science and Engineering",
  "Power Systems",
  "Thermal Engineering",
  "MBA",
  "Tamil",
  "English",
  "Mathematics",
  "Physical Education",
  "Physics",
  "Chemistry",
];

const inputCls =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm";
const labelCls = "block text-xs font-medium text-zinc-600";

export function FeedbackForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-6 text-sm text-green-700">
        Thank you! Your feedback has been recorded.
      </p>
    );
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-zinc-900">
          Personal Information
        </legend>
        <div>
          <label htmlFor="fb-name" className={labelCls}>Name</label>
          <input id="fb-name" required placeholder="Name" className={inputCls} />
        </div>
        <div>
          <label htmlFor="fb-email" className={labelCls}>Email</label>
          <input id="fb-email" type="email" required placeholder="Email" className={inputCls} />
        </div>
        <div>
          <label htmlFor="fb-dept" className={labelCls}>Department</label>
          <select id="fb-dept" className={inputCls} defaultValue="">
            <option value="" disabled>Select Department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fb-batch" className={labelCls}>Batch</label>
          <input id="fb-batch" placeholder="Batch" className={inputCls} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="fb-higher" className={labelCls}>Higher Studies</label>
            <input id="fb-higher" placeholder="Higher Studies" className={inputCls} />
          </div>
          <div>
            <label htmlFor="fb-company" className={labelCls}>Company Name</label>
            <input id="fb-company" placeholder="Company Name" className={inputCls} />
          </div>
          <div>
            <label htmlFor="fb-designation" className={labelCls}>Designation</label>
            <input id="fb-designation" placeholder="Designation" className={inputCls} />
          </div>
        </div>
        <div>
          <label htmlFor="fb-exp" className={labelCls}>Experience</label>
          <input id="fb-exp" placeholder="Experience" className={inputCls} />
        </div>
        <fieldset>
          <legend className={labelCls}>Entrepreneur</legend>
          <div className="mt-2 flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="entrepreneur" value="yes" /> Yes
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="entrepreneur" value="no" /> No
            </label>
          </div>
        </fieldset>
        <div>
          <label htmlFor="fb-business" className={labelCls}>Business Name</label>
          <input id="fb-business" placeholder="Business Name" className={inputCls} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-zinc-900">
          Feedback on Alumni Community
        </legend>
        <fieldset>
          <legend className={labelCls}>
            How would you rate your overall experience with the Alumni Network?
          </legend>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            {["Excellent", "Good", "Fair", "Poor"].map((r) => (
              <label key={r} className="flex items-center gap-2">
                <input type="radio" name="rating" value={r} /> {r}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className={labelCls}>
            Which aspects of the Alumni Network do you find most valuable? (Select all that apply)
          </legend>
          <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            {["Networking Opportunities", "Events and Reunions", "Career Support", "Forum Discussions", "Active Groups", "News and Updates", "Alumni Benefits"].map((a) => (
              <label key={a} className="flex items-center gap-2">
                <input type="checkbox" name="aspects" value={a} /> {a}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="fb-specific" className={labelCls}>Specific Feedback</label>
          <textarea id="fb-specific" rows={4} className={inputCls} />
        </div>
      </fieldset>

      <button
        type="submit"
        className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white"
      >
        Send
      </button>
    </form>
  );
}
