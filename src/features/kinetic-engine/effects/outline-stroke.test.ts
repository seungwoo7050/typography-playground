import { describe, expect, it, vi } from "vitest";
import type { GlyphOutline } from "../core/glyph-outline";

const fakePath = { __fakePath2D: true };
vi.mock("../core/glyph-outline", () => ({
  outlineToPath2D: vi.fn(() => fakePath),
}));

const { outlineStrokeEffect } = await import("./outline-stroke");

function createFakeCtx() {
  return {
    canvas: { width: 400, height: 300 },
    clearRect: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    lineJoin: "",
    lineWidth: 0,
    strokeStyle: "",
    lineDashOffset: 0,
  } as unknown as CanvasRenderingContext2D;
}

const outline: GlyphOutline = {
  commands: [],
  bbox: { x1: 0, y1: -50, x2: 100, y2: 0 },
  fontSize: 100,
};

describe("outlineStrokeEffect", () => {
  it("전체 캔버스를 클리어하고 Path2D를 stroke한다", () => {
    const ctx = createFakeCtx();
    outlineStrokeEffect.drawFrame?.(
      ctx,
      outline,
      outlineStrokeEffect.defaultParams,
      0,
    );
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 400, 300);
    expect(ctx.stroke).toHaveBeenCalledWith(fakePath);
  });

  it("strokeWidth/hue 파라미터를 lineWidth/strokeStyle에 반영한다", () => {
    const ctx = createFakeCtx();
    outlineStrokeEffect.drawFrame?.(
      ctx,
      outline,
      { strokeWidth: 7, hue: 120, dashed: false },
      0,
    );
    expect(ctx.lineWidth).toBe(7);
    expect(ctx.strokeStyle).toBe("hsl(120, 80%, 60%)");
  });

  it("dashed가 false면 setLineDash([])로 점선을 끈다", () => {
    const ctx = createFakeCtx();
    outlineStrokeEffect.drawFrame?.(
      ctx,
      outline,
      { strokeWidth: 3, hue: 0, dashed: false },
      0,
    );
    expect(ctx.setLineDash).toHaveBeenCalledWith([]);
  });

  it("dashed가 true면 점선 패턴을 설정하고 시간에 따라 dashOffset이 흐른다", () => {
    const ctx1 = createFakeCtx();
    const ctx2 = createFakeCtx();
    const params = { strokeWidth: 4, hue: 0, dashed: true };

    outlineStrokeEffect.drawFrame?.(ctx1, outline, params, 0);
    outlineStrokeEffect.drawFrame?.(ctx2, outline, params, 1);

    expect(ctx1.setLineDash).toHaveBeenCalledWith([8, 8]);
    expect(ctx1.lineDashOffset).not.toBe(ctx2.lineDashOffset);
  });
});
