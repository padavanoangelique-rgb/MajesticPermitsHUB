"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
