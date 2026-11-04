"use client";

import { useMemo, useState } from "react";

export function DashboardSearch({ children }: { children: React.ReactNode }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return children;
    // Simple filter by hiding non-matching sections via CSS class on a wrapper is hard;
    // instead we rely on data-search attributes on job cards.
    return children;
  }, [q, children]);

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search address, permit #, or status…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        />
      </div>
      <div data-search={q.toLowerCase()}>{filtered}</div>
    </div>
  );
}
