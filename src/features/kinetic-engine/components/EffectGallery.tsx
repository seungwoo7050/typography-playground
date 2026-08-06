"use client";

import { useMagnetic } from "@/lib/motion/magnetic";
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
          : "border border-mist px-4 py-2 text-sm text-ink hover:border-signal") +
        " focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      }
    >
      {effect.label}
    </button>
  );
}

export function EffectGallery({ effects, selectedId, onSelect }: EffectGalleryProps) {
  return (
    <div className="flex flex-wrap gap-2">
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
