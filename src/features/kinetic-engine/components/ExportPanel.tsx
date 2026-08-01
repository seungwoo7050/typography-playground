"use client";

import { useState } from "react";
import type { Font } from "opentype.js";
import {
  PNG_EXPORT_SIZES,
  downloadBlob,
  exportPng,
  sanitizeFilename,
} from "../export/png-export";
import type { AnyEffectDefinition } from "../effects/types";

interface ExportPanelProps {
  font: Font | null;
  text: string;
  effect: AnyEffectDefinition;
  params: Record<string, unknown>;
}

export function ExportPanel({ font, text, effect, params }: ExportPanelProps) {
  const [sizeId, setSizeId] = useState(PNG_EXPORT_SIZES[0].id);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!font || !text) return;
    const size =
      PNG_EXPORT_SIZES.find((s) => s.id === sizeId) ?? PNG_EXPORT_SIZES[0];
    setExporting(true);
    try {
      const blob = await exportPng(font, text, effect, params, size);
      downloadBlob(blob, `${sanitizeFilename(text)}-${effect.id}.png`);
    } finally {
      setExporting(false);
    }
  }

  return (
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
        {exporting ? "내보내는 중..." : "PNG 다운로드"}
      </button>
    </div>
  );
}
