"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Font } from "opentype.js";
import { useMagnetic } from "@/lib/motion/magnetic";
import { useScrollReveal } from "@/lib/motion/scroll-reveal";
import { centerOutline, extractGlyphOutline, type GlyphOutline } from "../core/glyph-outline";
import { computeExportFontSize } from "../export/png-export";
import type { AnyEffectDefinition } from "../effects/types";

interface EffectGalleryProps {
  effects: AnyEffectDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
  font: Font | null;
  text: string;
}

const THUMBNAIL_WIDTH = 96;
const THUMBNAIL_HEIGHT = 34;

interface EffectPreviewCanvasProps {
  effect: AnyEffectDefinition;
  outline: GlyphOutline | null;
}

/**
 * 버튼 안에 들어가는 정지 프레임 미리보기 — 라이브 캔버스처럼 계속
 * 애니메이션하지 않는다(이펙트 4개 + 메인 캔버스까지 동시에
 * 애니메이션 루프를 5개 돌리면 저사양 기기에서 프레임 예산을
 * 넘길 수 있다). t=0 한 프레임만 그려서 PNG export의 정적 프레임과
 * 같은 관례를 따른다 — glitch처럼 매 호출 랜덤인 이펙트도 최소한
 * "이런 느낌"이라는 정보는 준다.
 */
function EffectPreviewCanvas({ effect, outline }: EffectPreviewCanvasProps) {
  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const webglRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!outline) return;
    if (effect.renderTarget === "canvas2d") {
      const ctx = canvas2dRef.current?.getContext("2d");
      if (ctx) effect.drawFrame?.(ctx, outline, effect.defaultParams, 0);
    } else {
      const gl = webglRef.current?.getContext("webgl2");
      if (gl) {
        const glState = effect.initGL?.(gl, outline, effect.defaultParams);
        if (glState) {
          effect.renderGL?.(gl, glState, effect.defaultParams, 0);
          // 정지 프레임 한 장만 그리므로 그린 직후 리소스를 돌려준다 —
          // 이미 보낸 그리기 명령의 결과는 지워지지 않는다. 해제하지 않으면
          // 텍스트나 폰트가 바뀔 때마다 썸네일의 GPU 리소스가 쌓인다.
          effect.disposeGL?.(gl, glState);
        }
      }
    }
  }, [effect, outline]);

  return (
    <div className="relative h-[34px] w-24 shrink-0 overflow-hidden bg-paper">
      <canvas
        ref={canvas2dRef}
        width={THUMBNAIL_WIDTH}
        height={THUMBNAIL_HEIGHT}
        className="absolute inset-0 h-full w-full"
        style={{ display: effect.renderTarget === "canvas2d" ? "block" : "none" }}
      />
      <canvas
        ref={webglRef}
        width={THUMBNAIL_WIDTH}
        height={THUMBNAIL_HEIGHT}
        className="absolute inset-0 h-full w-full"
        style={{ display: effect.renderTarget === "webgl" ? "block" : "none" }}
      />
    </div>
  );
}

interface EffectThumbnailProps {
  effect: AnyEffectDefinition;
  outline: GlyphOutline | null;
  selected: boolean;
  onSelect: (id: string) => void;
}

function EffectThumbnail({ effect, outline, selected, onSelect }: EffectThumbnailProps) {
  const ref = useMagnetic<HTMLButtonElement>();
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(effect.id)}
      aria-pressed={selected}
      className={
        (selected
          ? "border border-ink bg-ink text-paper"
          : "border border-mist text-ink transition-colors hover:border-signal") +
        " flex flex-col gap-1.5 p-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      }
    >
      <EffectPreviewCanvas effect={effect} outline={outline} />
      <span className="px-0.5 text-sm">{effect.label}</span>
    </button>
  );
}

export function EffectGallery({ effects, selectedId, onSelect, font, text }: EffectGalleryProps) {
  // 라이브 캔버스(KineticPlayground)가 이미 800x280 기준으로 만든
  // outline을 그대로 쓰면 96x34짜리 썸네일엔 글자가 압도적으로 커서
  // 잘려나간다 — PNG export가 해상도별로 폰트 크기를 다시 계산해
  // 벡터 아웃라인을 재추출하는 것과 같은 이유로, 썸네일 크기에 맞는
  // 자기만의 outline을 따로 만든다.
  const thumbnailOutline = useMemo(() => {
    if (!font || !text) return null;
    const fontSize = computeExportFontSize(THUMBNAIL_WIDTH);
    const raw = extractGlyphOutline(font, text, fontSize);
    return centerOutline(raw, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
  }, [font, text]);

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
          outline={thumbnailOutline}
          selected={effect.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
