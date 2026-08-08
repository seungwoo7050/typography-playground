"use client";

import { useMagnetic } from "@/lib/motion/magnetic";
import { useScrollReveal } from "@/lib/motion/scroll-reveal";
import type { AnyEffectDefinition } from "../effects/types";

interface EffectGalleryProps {
  effects: AnyEffectDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
}

interface EffectThumbnailProps {
  effect: AnyEffectDefinition;
  selected: boolean;
  onSelect: (id: string) => void;
}

function EffectThumbnail({ effect, selected, onSelect }: EffectThumbnailProps) {
  const ref = useMagnetic<HTMLButtonElement>();
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(effect.id)}
      aria-pressed={selected}
      className={
        (selected
          ? "border border-ink bg-ink px-4 py-2 text-sm text-paper"
          : "border border-mist px-4 py-2 text-sm text-ink transition-colors hover:border-signal") +
        " focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      }
    >
      {effect.label}
    </button>
  );
}

export function EffectGallery({ effects, selectedId, onSelect }: EffectGalleryProps) {
  // 리빌은 컨테이너에만 건다 — 버튼 하나하나는 useMagnetic이 이미
  // style.transform을 매 프레임 직접 대입하므로, 같은 버튼에 CSS
  // translate 클래스까지 얹으면 둘이 transform 속성을 두고 서로
  // 충돌한다(마그네틱이 매 프레임 덮어써 리빌 오프셋이 씹힌다).
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`flex flex-wrap gap-2 transition-all duration-500 ease-out ${
        revealed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      {effects.map((effect) => (
        <EffectThumbnail
          key={effect.id}
          effect={effect}
          selected={effect.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
