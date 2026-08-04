import { describe, expect, it } from "vitest";
import { computeParallaxStyle } from "./scroll-parallax";

// useScrollParallax 훅(rAF 루프, DOM style 대입)은 jsdom이 rAF를
// 구현하지 않아 여기서 테스트하지 않는다 — 실제 브라우저로 검증한다.
// 여기서는 DOM/rAF와 분리된 순수 함수만 검증한다.

describe("computeParallaxStyle", () => {
  it("scrollY=0이면 이동 없음, 완전 불투명이다", () => {
    const { translateY, opacity } = computeParallaxStyle(0, 0.3, 320);
    expect(translateY).toBe(0);
    expect(opacity).toBe(1);
  });

  it("translateY는 scrollY*speed다", () => {
    const { translateY } = computeParallaxStyle(100, 0.3, 320);
    expect(translateY).toBeCloseTo(30, 5);
  });

  it("fadeDistance만큼 스크롤하면 opacity가 정확히 0이다", () => {
    const { opacity } = computeParallaxStyle(320, 0.3, 320);
    expect(opacity).toBe(0);
  });

  it("fadeDistance를 넘겨도 opacity가 음수로 내려가지 않는다(0에서 클램프)", () => {
    const { opacity } = computeParallaxStyle(1000, 0.3, 320);
    expect(opacity).toBe(0);
  });

  it("opacity는 1을 넘지 않는다(스크롤이 음수인 극단 상황 방어)", () => {
    const { opacity } = computeParallaxStyle(-50, 0.3, 320);
    expect(opacity).toBeLessThanOrEqual(1);
  });

  it("절반 지점에서 opacity가 정확히 0.5다", () => {
    const { opacity } = computeParallaxStyle(160, 0.3, 320);
    expect(opacity).toBeCloseTo(0.5, 5);
  });
});
