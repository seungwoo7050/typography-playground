import { describe, expect, it } from "vitest";
import { computeGifFrameCount, computeGifFrameDelayMs } from "./gif-export";

// captureFrames/exportGif는 캔버스/WebGL/Worker에 의존해 jsdom에서
// 검증할 수 없다(§png-export.ts와 같은 이유) — 실제 브라우저로
// 검증한다. 여기서는 DOM과 분리된 순수 함수만 다룬다.

describe("computeGifFrameCount", () => {
  it("2초 15fps면 30프레임이다", () => {
    expect(computeGifFrameCount(2000, 15)).toBe(30);
  });

  it("나누어떨어지지 않으면 반올림한다", () => {
    expect(computeGifFrameCount(1000, 12)).toBe(12);
  });
});

describe("computeGifFrameDelayMs", () => {
  it("15fps면 프레임당 약 66.67ms다", () => {
    expect(computeGifFrameDelayMs(15)).toBeCloseTo(66.67, 1);
  });

  it("10fps면 프레임당 100ms다", () => {
    expect(computeGifFrameDelayMs(10)).toBe(100);
  });
});
