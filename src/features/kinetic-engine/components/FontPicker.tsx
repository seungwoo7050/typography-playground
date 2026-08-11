"use client";

import { useScrollReveal } from "@/lib/motion/scroll-reveal";
import type { KineticFontDefinition } from "../core/font-loader";

interface FontPickerProps {
  fonts: KineticFontDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
}

interface FontButtonProps {
  font: KineticFontDefinition;
  selected: boolean;
  onSelect: (id: string) => void;
}

function FontButton({ font, selected, onSelect }: FontButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(font.id)}
      aria-pressed={selected}
      style={{ fontFamily: `"${font.label}"` }}
      className={
        (selected
          ? "border border-ink bg-ink px-4 py-2 text-sm text-paper"
          : "border border-mist px-4 py-2 text-sm text-ink transition-colors hover:border-signal") +
        " focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      }
    >
      {font.label}
    </button>
  );
}

interface FontGroupProps {
  label: string;
  fonts: KineticFontDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function FontGroup({ label, fonts, selectedId, onSelect }: FontGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs tracking-wide text-graphite uppercase">{label}</span>
      <div className="flex flex-wrap gap-2">
        {fonts.map((font) => (
          <FontButton
            key={font.id}
            font={font}
            selected={font.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

/** 각 폰트 이름을 실제 그 폰트로 렌더링해 고르기 전에 미리보기를
 * 보여준다(self-host된 WOFF2 @font-face 재사용 — opentype.js용
 * TTF와는 별개 파일이지만 같은 패밀리).
 *
 * 영문/한글 지원 두 그룹으로 나눈다 — 라틴 전용 폰트로 한글을
 * 입력하면 글리프가 없어 tofu 박스가 뜨는데(의도된 동작, §Nanum
 * 폰트 추가 커밋의 실측 확인 참고), 고르기 전에 어느 쪽인지 알 수
 * 있어야 헷갈리지 않는다. 페이지 레이아웃 자체를 다시 손대는 대신
 * 그룹 헤더만 얹는 가벼운 변경으로 유지했다(§최근 2단 레이아웃
 * 피드백 — 구조 변경은 신중하게).
 */
export function FontPicker({ fonts, selectedId, onSelect }: FontPickerProps) {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();
  const latinFonts = fonts.filter((f) => !f.supportsKorean);
  const koreanFonts = fonts.filter((f) => f.supportsKorean);

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-4 transition-all duration-500 ease-out ${
        revealed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <FontGroup label="영문" fonts={latinFonts} selectedId={selectedId} onSelect={onSelect} />
      <FontGroup label="한글 지원" fonts={koreanFonts} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
}
