"use client";

import type { AnyEffectDefinition } from "../effects/types";

interface ParamPanelProps {
  effect: AnyEffectDefinition;
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function ParamPanel({ effect, params, onChange }: ParamPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(effect.paramSchema).map(([key, schema]) => {
        if (schema.type === "number") {
          const value = Number(params[key] ?? 0);
          return (
            <label key={key} className="flex flex-col gap-1 text-sm text-graphite">
              <span>
                {schema.label} ({value})
              </span>
              <input
                type="range"
                min={schema.min}
                max={schema.max}
                step={schema.step}
                value={value}
                onChange={(e) =>
                  onChange({ ...params, [key]: Number(e.target.value) })
                }
              />
            </label>
          );
        }
        if (schema.type === "boolean") {
          const checked = Boolean(params[key]);
          return (
            <label key={key} className="flex items-center gap-2 text-sm text-graphite">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange({ ...params, [key]: e.target.checked })}
              />
              {schema.label}
            </label>
          );
        }
        // color 타입은 현재 이펙트 중 쓰는 게 없어 아직 구현하지 않음
        // (필요해지면 여기 추가 — ParamFieldSchema는 이미 지원).
        return null;
      })}
    </div>
  );
}
