import { describe, expect, it } from "vitest";
import { createProjectionMatrix, hslToRgb } from "./liquid-wave";

// initGL/renderGL은 실제 WebGL2 컨텍스트가 필요해(jsdom 미지원)
// 여기서 테스트하지 않는다 — 이펙트 갤러리 UI가 생긴 뒤 실제
// 브라우저로 시각 검증한다. 여기서는 셰이더와 무관한 순수 수학
// 함수(투영 행렬, HSL->RGB 변환)만 검증한다.

/** mat3(열 우선) * vec3(x, y, 1) — GLSL의 u_projection * vec3(pos, 1)과 동일 연산. */
function applyProjection(
  matrix: Float32Array,
  x: number,
  y: number,
): { x: number; y: number } {
  return {
    x: matrix[0] * x + matrix[3] * y + matrix[6],
    y: matrix[1] * x + matrix[4] * y + matrix[7],
  };
}

describe("createProjectionMatrix", () => {
  it("오프셋 없이 캔버스 좌상단(0,0)은 클립 공간 (-1,1)로 매핑된다", () => {
    const m = createProjectionMatrix(100, 100, 0, 0);
    const p = applyProjection(m, 0, 0);
    expect(p.x).toBeCloseTo(-1);
    expect(p.y).toBeCloseTo(1);
  });

  it("캔버스 우하단(w,h)은 클립 공간 (1,-1)로 매핑된다", () => {
    const m = createProjectionMatrix(100, 100, 0, 0);
    const p = applyProjection(m, 100, 100);
    expect(p.x).toBeCloseTo(1);
    expect(p.y).toBeCloseTo(-1);
  });

  it("캔버스 중앙은 클립 공간 원점(0,0)으로 매핑된다", () => {
    const m = createProjectionMatrix(100, 100, 0, 0);
    const p = applyProjection(m, 50, 50);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it("offsetX/offsetY만큼 평행이동한 뒤 투영한다", () => {
    // 글리프 로컬 원점(0,0)이 캔버스 중앙(50,50)에 오도록 오프셋을
    // 주면, 로컬 (0,0)이 클립 공간 원점으로 매핑되어야 한다.
    const m = createProjectionMatrix(100, 100, 50, 50);
    const p = applyProjection(m, 0, 0);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });
});

describe("hslToRgb", () => {
  it("h=0(빨강)을 정확히 변환한다", () => {
    expect(hslToRgb(0, 1, 0.5)).toEqual([1, 0, 0]);
  });

  it("h=120(초록)을 정확히 변환한다", () => {
    const [r, g, b] = hslToRgb(120, 1, 0.5);
    expect(r).toBeCloseTo(0);
    expect(g).toBeCloseTo(1);
    expect(b).toBeCloseTo(0);
  });

  it("h=240(파랑)을 정확히 변환한다", () => {
    const [r, g, b] = hslToRgb(240, 1, 0.5);
    expect(r).toBeCloseTo(0);
    expect(g).toBeCloseTo(0);
    expect(b).toBeCloseTo(1);
  });

  it("saturation 0이면 hue와 무관하게 회색(l,l,l)이다", () => {
    expect(hslToRgb(200, 0, 0.3)).toEqual([0.3, 0.3, 0.3]);
  });

  it("l=1이면 흰색, l=0이면 검은색이다", () => {
    expect(hslToRgb(0, 0.5, 1)).toEqual([1, 1, 1]);
    expect(hslToRgb(0, 0.5, 0)).toEqual([0, 0, 0]);
  });
});
