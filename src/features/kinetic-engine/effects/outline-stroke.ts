import { outlineToPath2D } from "../core/glyph-outline";
import type { EffectDefinition } from "./types";

export interface OutlineStrokeParams {
  strokeWidth: number;
  hue: number;
  dashed: boolean;
}

/**
 * gradient-fill과 같은 파이프라인(전체 클리어 → Path2D)을 stroke에
 * 적용한 두 번째 확인 — 채우기 대신 외곽선만 그리는 케이스가
 * 문제없이 같은 아키텍처를 탄다는 걸 검증한다.
 */
export const outlineStrokeEffect: EffectDefinition<OutlineStrokeParams> = {
  id: "outline-stroke",
  label: "Outline Stroke",
  renderTarget: "canvas2d",
  defaultParams: { strokeWidth: 3, hue: 210, dashed: false },
  paramSchema: {
    strokeWidth: { type: "number", label: "Width", min: 1, max: 20, step: 1 },
    hue: { type: "number", label: "Hue", min: 0, max: 360, step: 5 },
    dashed: { type: "boolean", label: "Dashed" },
  },
  supportsSvgExport: true,
  drawFrame(ctx, outline, params, t) {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const path = outlineToPath2D(outline);
    ctx.lineJoin = "round";
    ctx.lineWidth = params.strokeWidth;
    ctx.strokeStyle = `hsl(${params.hue}, 80%, 60%)`;

    if (params.dashed) {
      ctx.setLineDash([params.strokeWidth * 2, params.strokeWidth * 2]);
      // 시간에 따라 흐르는 "marching ants" — 정지 이펙트가 아님을
      // stroke 계열에서도 확인하는 지점.
      ctx.lineDashOffset = -t * 40;
    } else {
      ctx.setLineDash([]);
    }

    ctx.stroke(path);
  },
};
