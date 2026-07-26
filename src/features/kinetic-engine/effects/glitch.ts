import { outlineToPath2D } from "../core/glyph-outline";
import type { GlyphOutline } from "../core/glyph-outline";
import type { EffectDefinition } from "./types";

export interface GlitchParams {
  /** 0-1, 밴드 최대 가로 오프셋(px)에 곱해지는 강도 */
  intensity: number;
  bandCount: number;
  /** R/G/B 레이어 사이 가로 분리 간격(px) */
  chromaticAberration: number;
}

const OFFSCREEN_PADDING = 20;
const MAX_OFFSET_PX = 30;

/**
 * 밴드마다 랜덤 가로 오프셋을 계산한다 — 실제 드로잉(캔버스 API)과
 * 분리된 순수 함수라 jsdom에서도 유닛 테스트 가능하다. rng를
 * 주입할 수 있어(기본은 Math.random) 테스트에서 결정론적으로
 * 검증한다.
 */
export function calculateBandOffsets(
  bandCount: number,
  intensity: number,
  rng: () => number = Math.random,
): number[] {
  const maxOffset = intensity * MAX_OFFSET_PX;
  return Array.from({ length: bandCount }, () => (rng() * 2 - 1) * maxOffset);
}

type TintedLayers = {
  red: OffscreenCanvas | HTMLCanvasElement;
  green: OffscreenCanvas | HTMLCanvasElement;
  blue: OffscreenCanvas | HTMLCanvasElement;
};

// outline 객체별로 한 번만 오프스크린 렌더링한다 — 매 프레임 다시
// 그리지 않는다("1회 렌더 후 재사용"). outline이 더 이상 참조되지
// 않으면 WeakMap이 자동으로 캐시를 회수한다.
const layerCache = new WeakMap<GlyphOutline, TintedLayers>();

function createCanvas(width: number, height: number) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function renderTintedLayer(
  outline: GlyphOutline,
  width: number,
  height: number,
  color: string,
): OffscreenCanvas | HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.translate(-outline.bbox.x1 + OFFSCREEN_PADDING, -outline.bbox.y1 + OFFSCREEN_PADDING);
  const path = outlineToPath2D(outline);
  ctx.fillStyle = color;
  ctx.fill(path);
  return canvas;
}

function getOrRenderTintedLayers(outline: GlyphOutline): TintedLayers {
  const cached = layerCache.get(outline);
  if (cached) return cached;

  const width = Math.ceil(outline.bbox.x2 - outline.bbox.x1) + OFFSCREEN_PADDING * 2;
  const height = Math.ceil(outline.bbox.y2 - outline.bbox.y1) + OFFSCREEN_PADDING * 2;
  const layers: TintedLayers = {
    red: renderTintedLayer(outline, width, height, "red"),
    green: renderTintedLayer(outline, width, height, "green"),
    blue: renderTintedLayer(outline, width, height, "blue"),
  };
  layerCache.set(outline, layers);
  return layers;
}

function drawBandedLayer(
  ctx: CanvasRenderingContext2D,
  layer: OffscreenCanvas | HTMLCanvasElement,
  destX: number,
  destY: number,
  offsets: number[],
) {
  const bandHeight = layer.height / offsets.length;
  offsets.forEach((offsetX, i) => {
    const srcY = i * bandHeight;
    ctx.drawImage(
      layer as CanvasImageSource,
      0,
      srcY,
      layer.width,
      bandHeight,
      destX + offsetX,
      destY + srcY,
      layer.width,
      bandHeight,
    );
  });
}

/**
 * WebGL 없이도 글리치를 구현할 수 있음을 보여주는 이펙트 — 오프스크린
 * 캔버스에 R/G/B 채널별로 틴트된 실루엣을 1회 렌더링해두고, 매
 * 프레임 수평 밴드를 무작위 가로 오프셋으로 잘라 재드로우한다.
 * 'lighter' 합성으로 세 채널이 어긋나면 색수차(chromatic aberration)
 * 처럼 보인다.
 */
export const glitchEffect: EffectDefinition<GlitchParams> = {
  id: "glitch",
  label: "Glitch",
  renderTarget: "canvas2d",
  defaultParams: { intensity: 0.5, bandCount: 12, chromaticAberration: 4 },
  paramSchema: {
    intensity: { type: "number", label: "Intensity", min: 0, max: 1, step: 0.05 },
    bandCount: { type: "number", label: "Bands", min: 2, max: 40, step: 1 },
    chromaticAberration: {
      type: "number",
      label: "Chromatic Aberration",
      min: 0,
      max: 20,
      step: 1,
    },
  },
  // 프레임마다 무작위로 재계산되는 절차적 이펙트라 정적 SVG로 의미
  // 있게 표현할 방법이 없다.
  supportsSvgExport: false,
  drawFrame(ctx, outline, params) {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layers = getOrRenderTintedLayers(outline);
    const destX = outline.bbox.x1 - OFFSCREEN_PADDING;
    const destY = outline.bbox.y1 - OFFSCREEN_PADDING;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const redOffsets = calculateBandOffsets(params.bandCount, params.intensity);
    const greenOffsets = calculateBandOffsets(params.bandCount, params.intensity);
    const blueOffsets = calculateBandOffsets(params.bandCount, params.intensity);

    drawBandedLayer(ctx, layers.red, destX - params.chromaticAberration, destY, redOffsets);
    drawBandedLayer(ctx, layers.green, destX, destY, greenOffsets);
    drawBandedLayer(ctx, layers.blue, destX + params.chromaticAberration, destY, blueOffsets);

    ctx.restore();
  },
};
