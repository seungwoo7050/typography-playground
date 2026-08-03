"use client";

import { useState } from "react";

interface StyleCardProps {
  label: string;
  output: string;
  /** 카드 그리드 전체에 스태거드(계단식) 크로스페이드를 만들기 위한
   * 개별 지연 시간(ms) — 타이핑할 때마다 낮은 인덱스 카드부터
   * 순서대로 나타난다. */
  delayMs?: number;
}

const COPIED_FEEDBACK_DURATION_MS = 1500;

export function StyleCard({ label, output, delayMs = 0 }: StyleCardProps) {
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
      <p
        key={output}
        style={{
          animationName: "style-card-fade",
          animationDuration: "150ms",
          animationTimingFunction: "ease-out",
          animationFillMode: "both",
          animationDelay: `${delayMs}ms`,
        }}
        className="min-h-8 break-all text-lg text-ink"
      >
        {output || <span className="text-graphite">—</span>}
      </p>
    </button>
  );
}
