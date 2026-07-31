import { describe, expect, it } from "vitest";
import { calculateMagneticOffset, lerp } from "./magnetic";

// useMagnetic 훅(rAF 루프, DOM style 대입)은 jsdom이 rAF를 구현하지
// 않아 여기서 테스트하지 않는다 — 실제 브라우저로 검증한다. 여기서는
// DOM/rAF와 분리된 순수 함수(오프셋 계산, lerp)만 검증한다.

const rect = { left: 100, top: 100, width: 40, height: 40 }; // 중심 (120, 120)

describe("calculateMagneticOffset", () => {
  it("radius 밖이면 오프셋이 0이다", () => {
    expect(calculateMagneticOffset(120, 120 + 71, rect, 70, 16)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("포인터가 정확히 중심에 있으면 오프셋이 0이다", () => {
    expect(calculateMagneticOffset(120, 120, rect, 70, 16)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("변위는 중심(당길 방향 없음)과 radius 경계(당김 비율 0) 양쪽에서 작고 그 사이에서 최댓값을 가진다", () => {
    // dx*pull 형태라 중심(dx=0)과 경계(pull=0) 양쪽에서 0에 가깝고,
    // 그 사이 어딘가에서 최대가 되는 포물선 모양이다 — 실제 마그네틱
    // 버튼 구현들의 전형적인 형태(중심에 딱 있으면 당길 방향이 없다).
    const atCenter = calculateMagneticOffset(120, 120, rect, 70, 16);
    const atMid = calculateMagneticOffset(155, 120, rect, 70, 16); // 중심에서 35px(=radius/2)
    const atEdge = calculateMagneticOffset(189, 120, rect, 70, 16); // 중심에서 69px(경계 직전)

    expect(Math.abs(atMid.x)).toBeGreaterThan(Math.abs(atCenter.x));
    expect(Math.abs(atMid.x)).toBeGreaterThan(Math.abs(atEdge.x));
  });

  it("포인터 방향으로(양수 x는 양수 오프셋) 당긴다", () => {
    const right = calculateMagneticOffset(150, 120, rect, 70, 16);
    const left = calculateMagneticOffset(90, 120, rect, 70, 16);
    expect(right.x).toBeGreaterThan(0);
    expect(left.x).toBeLessThan(0);
  });

  it("중심에 있을 때(distance=0) 오프셋 크기가 strength를 넘지 않는다", () => {
    // 대각선 방향으로 근접했을 때도 strength가 상한이어야 한다.
    const offset = calculateMagneticOffset(122, 122, rect, 70, 16);
    const magnitude = Math.hypot(offset.x, offset.y);
    expect(magnitude).toBeLessThanOrEqual(16);
  });
});

describe("lerp", () => {
  it("ease=0이면 변화가 없다", () => {
    expect(lerp(10, 100, 0)).toBe(10);
  });

  it("ease=1이면 target으로 완전히 스냅된다", () => {
    expect(lerp(10, 100, 1)).toBe(100);
  });

  it("ease=0.5면 정확히 중간값이다", () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it("반복 호출할수록 target에 점근적으로 수렴한다", () => {
    let current = 0;
    for (let i = 0; i < 50; i++) {
      current = lerp(current, 100, 0.15);
    }
    expect(current).toBeCloseTo(100, 0);
  });
});
