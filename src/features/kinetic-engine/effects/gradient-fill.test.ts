import { describe, expect, it, vi } from "vitest";
import type { GlyphOutline } from "../core/glyph-outline";

// jsdom은 Path2D를 구현하지 않으므로 outlineToPath2D를 스텁으로
// 대체한다 — 이 테스트는 gradient-fill의 ctx 호출 순서/인자를
// 검증하는 것이지 Path2D 변환 자체를 검증하는 게 아니다(그건
// glyph-outline.ts가 아니라 Playwright 스크린샷 회귀의 몫).
const fakePath = { __fakePath2D: true };
vi.mock("../core/glyph-outline", () => ({
  outlineToPath2D: vi.fn(() => fakePath),
}));

const { gradientFillEffect } = await import("./gradient-fill");

function createFakeCtx() {
  return {
    canvas: { width: 400, height: 300 },
    clearRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    fill: vi.fn(),
    fillStyle: undefined as unknown,
  } as unknown as CanvasRenderingContext2D;
}

const outline: GlyphOutline = {
  commands: [],
  bbox: { x1: 10, y1: -50, x2: 90, y2: 0 },
  fontSize: 100,
};

describe("gradientFillEffect", () => {
  it("매 프레임 전체 캔버스를 클리어한다", () => {
    const ctx = createFakeCtx();
    gradientFillEffect.drawFrame?.(ctx, outline, gradientFillEffect.defaultParams, 0);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 400, 300);
  });

  it("bbox x1/x2를 기준으로 선형 그라디언트를 만든다", () => {
    const ctx = createFakeCtx();
    gradientFillEffect.drawFrame?.(ctx, outline, gradientFillEffect.defaultParams, 0);
    expect(ctx.createLinearGradient).toHaveBeenCalledWith(10, 0, 90, 0);
  });

  it("시간(t)에 따라 hue가 회전한다", () => {
    const ctx1 = createFakeCtx();
    const ctx2 = createFakeCtx();
    const params = { hueSpeed: 90, saturation: 80, lightness: 55 };

    gradientFillEffect.drawFrame?.(ctx1, outline, params, 0);
    gradientFillEffect.drawFrame?.(ctx2, outline, params, 1);

    const stop1 = (ctx1.createLinearGradient as ReturnType<typeof vi.fn>).mock
      .results[0].value.addColorStop as ReturnType<typeof vi.fn>;
    const stop2 = (ctx2.createLinearGradient as ReturnType<typeof vi.fn>).mock
      .results[0].value.addColorStop as ReturnType<typeof vi.fn>;

    // t=0: hue=0, t=1(1초 후 hueSpeed=90): hue=90 — 서로 달라야 한다.
    expect(stop1.mock.calls[0][1]).not.toBe(stop2.mock.calls[0][1]);
  });

  it("변환된 Path2D로 fill한다", () => {
    const ctx = createFakeCtx();
    gradientFillEffect.drawFrame?.(ctx, outline, gradientFillEffect.defaultParams, 0);
    expect(ctx.fill).toHaveBeenCalledWith(fakePath);
  });
});
