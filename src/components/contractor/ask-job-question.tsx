"use client";

import { useState } from "react";

export function AskJobQuestion({
  jobId,
  address,
}: {
  jobId: string;
  address: string;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/contractor/job-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, question: question.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send. Try again.");
        return;
      }
      setDone(true);
      setQuestion("");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
        Sent. Angelique has the job details and your question. She’ll reply by text.
      </div>
    );
  }

  return (
    <div className="mt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-violet-400/40 bg-card px-4 py-3 text-sm font-semibold text-primary hover:bg-secondary sm:w-auto"
        >
          What’s up with this one?
        </button>
      ) : (
        <form onSubmit={submit} className="rounded-xl border border-violet-400/30 bg-card/80 p-4">
          <p className="text-sm font-semibold text-primary">Ask about {address}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your question goes to Angelique as a text with the full job details. She can reply right back.
          </p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="What do you need on this job?"
            className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={busy || !question.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send question"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
