"use client";

import { useState } from "react";

export function HomeownerSharePanel({
  jobId,
  url,
  brandName,
}: {
  jobId: string;
  url: string;
  brandName: string;
}) {
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function send() {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch(`/api/contractor/jobs/${jobId}/share-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, name, email, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send");
      setMsg(channel === "sms" ? "Text sent." : "Email sent.");
    } catch (err: any) {
      setError(err.message || "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Share this status page with the homeowner. It is branded as{" "}
        <strong>{brandName}</strong>. Type the contact you want to send it to —
        nothing is filled in automatically.
      </p>
      {url ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800">
            {url}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(url);
              setMsg("Copied");
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-700"
          >
            Copy link
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Send below and a tracking link will be created.
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setChannel("email")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            channel === "email"
              ? "bg-[#156cdd] text-white"
              : "border border-slate-200 dark:border-slate-700"
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setChannel("sms")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            channel === "sms"
              ? "bg-[#156cdd] text-white"
              : "border border-slate-200 dark:border-slate-700"
          }`}
        >
          Text
        </button>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Recipient name (optional)"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202] dark:text-white"
      />
      {channel === "email" ? (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="homeowner@email.com"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202] dark:text-white"
        />
      ) : (
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(561) 555-1212"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202] dark:text-white"
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {msg && <p className="text-xs text-green-600">{msg}</p>}
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className="rounded-xl bg-[#156cdd] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Sending…" : channel === "sms" ? "Send text" : "Send email"}
      </button>
    </div>
  );
}
