"use client";

import { useState } from "react";
import type { Font } from "opentype.js";
import {
  PNG_EXPORT_SIZES,
  downloadBlob,
  exportPng,
  sanitizeFilename,
  type ExportPhase,
} from "../export/png-export";
import type { AnyEffectDefinition } from "../effects/types";

interface ExportPanelProps {
  font: Font | null;
  text: string;
  effect: AnyEffectDefinition;
  params: Record<string, unknown>;
}

// canvas.toBlob()은 브라우저가 세부 인코딩 퍼센트를 노출하지 않는다
// — 그래서 실제 진행률 대신, 코드가 실제로 통과하는 체크포인트에
// 각각 목표 지점을 대응시킨다. 체크포인트 사이의 시각적 보간에는
// CSS transition을 쓰지만(급하게 점프하는 대신 부드럽게 따라잡게),
// 목표값 자체는 전부 실제 신호에서 온다 — 타이머로 지어낸 가짜
// 퍼센트가 아니다.
const PHASE_PROGRESS: Record<ExportPhase, number> = {
  preparing: 0.15,
  rendering: 0.4,
  encoding: 0.75,
  done: 1,
};

const PHASE_LABEL: Record<ExportPhase, string> = {
  preparing: "준비 중",
  rendering: "렌더링 중",
  encoding: "인코딩 중",
  done: "완료",
};

export function ExportPanel({ font, text, effect, params }: ExportPanelProps) {
  const [sizeId, setSizeId] = useState(PNG_EXPORT_SIZES[0].id);
  const [phase, setPhase] = useState<ExportPhase | null>(null);

  async function handleExport() {
    if (!font || !text) return;
    const size =
      PNG_EXPORT_SIZES.find((s) => s.id === sizeId) ?? PNG_EXPORT_SIZES[0];
    setPhase("preparing");
    try {
      const blob = await exportPng(font, text, effect, params, size, setPhase);
      downloadBlob(blob, `${sanitizeFilename(text)}-${effect.id}.png`);
    } finally {
      setPhase(null);
    }
  }

  const exporting = phase !== null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={sizeId}
          onChange={(e) => setSizeId(e.target.value)}
          className="border border-mist bg-paper px-3 py-2 text-sm text-ink"
        >
          {PNG_EXPORT_SIZES.map((size) => (
            <option key={size.id} value={size.id}>
              {size.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleExport}
          disabled={!font || !text || exporting}
          className="border border-ink bg-ink px-4 py-2 text-sm text-paper disabled:cursor-default disabled:opacity-40"
        >
          {exporting ? (PHASE_LABEL[phase] ?? "내보내는 중") : "PNG 다운로드"}
        </button>
      </div>
      <div
        role="progressbar"
        aria-hidden={!exporting}
        aria-valuenow={exporting ? Math.round(PHASE_PROGRESS[phase] * 100) : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`h-0.5 w-full max-w-48 bg-mist transition-opacity duration-150 ${
          exporting ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="h-full bg-signal transition-[width] duration-200 ease-out"
          style={{ width: `${(exporting ? PHASE_PROGRESS[phase] : 0) * 100}%` }}
        />
      </div>
    </div>
  );
}
