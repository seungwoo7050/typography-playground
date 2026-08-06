"use client";

import { useLayoutEffect, useRef } from "react";
import type { AnyEffectDefinition } from "../effects/types";

interface ParamPanelProps {
  effect: AnyEffectDefinition;
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

const MORPH_DURATION_MS = 300;

export function ParamPanel({ effect, params, onChange }: ParamPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef<number | null>(null);
  const prevEffectIdRef = useRef<string | null>(null);

  // FLIP(First-Last-Invert-Play): 이펙트가 바뀌면 파라미터 행 개수/
  // 종류가 통째로 달라진다 — unmount/remount로 툭 끊기게 만드는
  // 대신, 이전 높이(First)를 기억해뒀다가 리렌더 직후(DOM은 이미
  // 새 높이=Last) 잠깐 이전 높이로 되돌리고(Invert) height
  // transition으로 새 높이까지 자연스럽게 흘려보낸다(Play).
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const effectChanged =
      prevEffectIdRef.current !== null && prevEffectIdRef.current !== effect.id;

    if (effectChanged && prevHeightRef.current !== null) {
      const newHeight = el.getBoundingClientRect().height;
      const firstHeight = prevHeightRef.current;

      el.style.transition = "none";
      el.style.overflow = "hidden";
      el.style.height = `${firstHeight}px`;
      void el.offsetHeight; // 강제 리플로우 — transition:none을 실제로 적용한다.
      el.style.transition = `height ${MORPH_DURATION_MS}ms ease-out`;
      el.style.height = `${newHeight}px`;

      const clearOverrides = () => {
        el.style.height = "";
        el.style.overflow = "";
        el.style.transition = "";
      };
      el.addEventListener("transitionend", clearOverrides, { once: true });
    }

    prevHeightRef.current = el.getBoundingClientRect().height;
    prevEffectIdRef.current = effect.id;
  }, [effect]);

  return (
    <div ref={containerRef} className="flex flex-col gap-4">
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
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
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
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
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
