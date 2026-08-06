"use client";

import type { KineticFontDefinition } from "../core/font-loader";

interface FontPickerProps {
  fonts: KineticFontDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** 각 폰트 이름을 실제 그 폰트로 렌더링해 고르기 전에 미리보기를
 * 보여준다(self-host된 WOFF2 @font-face 재사용 — opentype.js용
 * TTF와는 별개 파일이지만 같은 패밀리). */
export function FontPicker({ fonts, selectedId, onSelect }: FontPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {fonts.map((font) => {
        const selected = font.id === selectedId;
        return (
          <button
            key={font.id}
            type="button"
            onClick={() => onSelect(font.id)}
            aria-pressed={selected}
            style={{ fontFamily: `"${font.label}"` }}
            className={
              (selected
                ? "border border-ink bg-ink px-4 py-2 text-sm text-paper"
                : "border border-mist px-4 py-2 text-sm text-ink hover:border-signal") +
              " focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            }
          >
            {font.label}
          </button>
        );
      })}
    </div>
  );
}
