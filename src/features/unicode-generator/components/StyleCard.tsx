"use client";

import { useState } from "react";

interface StyleCardProps {
  label: string;
  output: string;
}

const COPIED_FEEDBACK_DURATION_MS = 1500;

export function StyleCard({ label, output }: StyleCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_DURATION_MS);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!output}
      className="flex flex-col gap-2 border border-mist p-4 text-left enabled:hover:border-signal disabled:cursor-default"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-wide text-graphite uppercase">
          {label}
        </span>
        {output && (
          <span className="text-xs text-graphite">
            {copied ? "Copied" : "Copy"}
          </span>
        )}
      </div>
      <p className="min-h-8 break-all text-lg text-ink">
        {output || <span className="text-graphite">—</span>}
      </p>
    </button>
  );
}
