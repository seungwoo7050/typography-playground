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
      className="flex flex-col gap-2 border border-mist p-4 text-left transition-colors enabled:hover:border-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-default"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-wide text-graphite uppercase">
          {label}
        </span>
        {output && (
          <span className="text-xs text-graphite" aria-live="polite">
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
        // 잘고(zalgo)류 스타일은 한 글자에 결합 발음구별기호(combining
        // mark)를 수십 개까지 쌓는다 — 이런 문자 하나는 브라우저가
        // 그래핌 클러스터(자소 단위)로 취급해 break-all로도 쪼개
        // 줄바꿈하지 않는다. overflow-wrap:anywhere를 함께 걸어야
        // 그런 경우에도 카드 폭을 넘기지 않고 강제로 줄바꿈한다
        // (실측: 뷰포트 320px에서 Zalgo (High) 카드가 overflow-wrap
        // 없이는 최대 1007px까지 옆으로 넘쳤다).
        className="min-h-8 break-all text-lg text-ink [overflow-wrap:anywhere]"
      >
        {output || <span className="text-graphite">—</span>}
      </p>
    </button>
  );
}
