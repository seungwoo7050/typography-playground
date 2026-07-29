"use client";

import type { AnyEffectDefinition } from "../effects/types";

interface EffectGalleryProps {
  effects: AnyEffectDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function EffectGallery({ effects, selectedId, onSelect }: EffectGalleryProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {effects.map((effect) => {
        const selected = effect.id === selectedId;
        return (
          <button
            key={effect.id}
            type="button"
            onClick={() => onSelect(effect.id)}
            aria-pressed={selected}
            className={
              selected
                ? "border border-ink bg-ink px-4 py-2 text-sm text-paper"
                : "border border-mist px-4 py-2 text-sm text-ink hover:border-signal"
            }
          >
            {effect.label}
          </button>
        );
      })}
    </div>
  );
}
