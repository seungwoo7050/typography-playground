import { outlineToPath2D } from "../core/glyph-outline";
import type { EffectDefinition } from "./types";

export interface GradientFillParams {
  /** 초당 색상 회전 속도(도) */
  hueSpeed: number;
  saturation: number;
  lightness: number;
}

/**
 * 렌더 파이프라인을 검증하는 가장 저비용 이펙트 — 이후 모든
 * canvas2d 이펙트가 따르는 기본 패턴(매 프레임 전체 클리어 → 글리프
 * Path2D fill)을 여기서 확립한다.
 *
 * 좌표계: outline.commands는 opentype.js가 추출한 원본 좌표(보통
 * x=0 근방에서 시작)다. 캔버스 중앙에 배치하는 건 이 이펙트의 책임이
 * 아니다 — 호출하는 쪽(Canvas 컴포넌트)이 ctx.translate로 이미
 * 위치를 잡아둔 상태에서 drawFrame이 호출된다고 가정한다.
 */
export const gradientFillEffect: EffectDefinition<GradientFillParams> = {
  id: "gradient-fill",
  label: "Gradient Fill",
  renderTarget: "canvas2d",
  defaultParams: { hueSpeed: 40, saturation: 80, lightness: 55 },
  paramSchema: {
    hueSpeed: { type: "number", label: "Speed", min: 0, max: 120, step: 5 },
    saturation: {
      type: "number",
      label: "Saturation",
      min: 0,
      max: 100,
      step: 5,
    },
    lightness: { type: "number", label: "Lightness", min: 0, max: 100, step: 5 },
  },
  // 정적 프레임(고정된 t)도 그라디언트 stop 두 개로 충실히 재현 가능한
  // 벡터 표현이라 SVG export를 지원한다.
  supportsSvgExport: true,
  drawFrame(ctx, outline, params, t) {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const path = outlineToPath2D(outline);
    const { bbox } = outline;
    const hue = (t * params.hueSpeed) % 360;

    const gradient = ctx.createLinearGradient(bbox.x1, 0, bbox.x2, 0);
    gradient.addColorStop(
      0,
      `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`,
    );
    gradient.addColorStop(
      1,
      `hsl(${(hue + 120) % 360}, ${params.saturation}%, ${params.lightness}%)`,
    );

    ctx.fillStyle = gradient;
    ctx.fill(path);
  },
};
