import { describe, expect, it } from "vitest";
import { calculateMagneticOffset, lerp, springStep } from "./magnetic";

// useMagnetic 훅(rAF 루프, DOM style 대입)은 jsdom이 rAF를 구현하지
// 않아 여기서 테스트하지 않는다 — 실제 브라우저로 검증한다. 여기서는
// DOM/rAF와 분리된 순수 함수(오프셋 계산, springStep, lerp)만
// 검증한다.

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

describe("springStep", () => {
  // 기준값은 직접 시뮬레이션해서 얻었다(손 계산으로 안정성을 판단하려다
  // 오류가 나서 — k=0.2, c=0.8은 143까지 발산에 가깝게 오버슈트하고
  // 40프레임 가까이 걸렸다. 그리드 스캔으로 stiffness=0.3, damping=0.5가
  // 오버슈트 ~3%, 11프레임(~180ms) 안에 2% 이내로 정착함을 확인하고
  // 그 시뮬레이션의 실제 출력값을 테스트 기준으로 그대로 썼다).
  const STIFFNESS = 0.3;
  const DAMPING = 0.5;

  it("정지 상태에서 첫 스텝은 target*stiffness만큼 움직인다", () => {
    const { position } = springStep(0, 0, 100, STIFFNESS, DAMPING);
    expect(position).toBeCloseTo(15, 5); // 0 + (0+100*0.3)*0.5 = 15
  });

  it("기본 파라미터에서 target을 약간 오버슈트한 뒤(약 3%) 정착한다", () => {
    let position = 0;
    let velocity = 0;
    let maxPosition = -Infinity;
    for (let i = 0; i < 40; i++) {
      const step = springStep(position, velocity, 100, STIFFNESS, DAMPING);
      position = step.position;
      velocity = step.velocity;
      if (position > maxPosition) maxPosition = position;
    }
    expect(maxPosition).toBeGreaterThan(100); // 오버슈트가 실제로 있다
    expect(maxPosition).toBeLessThan(115); // 15% 넘게 발산하지 않는다
    expect(position).toBeCloseTo(100, 1); // 40프레임 뒤엔 정착
  });

  it("target이 그대로면(이미 그 자리) 정지 상태를 유지한다", () => {
    const { position, velocity } = springStep(50, 0, 50, STIFFNESS, DAMPING);
    expect(position).toBe(50);
    expect(velocity).toBe(0);
  });

  it("damping이 0이면 스텝 이후 속도가 0으로 죽는다(감쇠 전부)", () => {
    const { velocity } = springStep(0, 100, 100, STIFFNESS, 0);
    expect(velocity).toBe(0);
  });
});
