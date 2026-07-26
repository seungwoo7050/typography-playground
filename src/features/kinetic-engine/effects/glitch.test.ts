import { describe, expect, it } from "vitest";
import { calculateBandOffsets } from "./glitch";

// drawFrame(오프스크린 렌더링, drawImage 합성)은 jsdom이 canvas를
// 구현하지 않아 여기서 테스트하지 않는다 — 실제 시각 검증은 이펙트
// 갤러리 UI가 생긴 뒤 실제 브라우저로 확인한다. 여기서는 캔버스 API와
// 분리된 순수 함수(밴드 오프셋 계산)만 검증한다.

describe("calculateBandOffsets", () => {
  it("bandCount만큼 오프셋을 생성한다", () => {
    const offsets = calculateBandOffsets(12, 0.5);
    expect(offsets.length).toBe(12);
  });

  it("intensity가 0이면 모든 오프셋이 0이다", () => {
    const offsets = calculateBandOffsets(8, 0);
    expect(offsets.every((o) => o === 0)).toBe(true);
  });

  it("오프셋은 -intensity*30 ~ +intensity*30 범위 안에 있다", () => {
    const intensity = 0.7;
    const maxOffset = intensity * 30;
    // rng를 0과 1 경계값으로 고정해 극단값을 결정론적으로 검증한다.
    const atMin = calculateBandOffsets(5, intensity, () => 0);
    const atMax = calculateBandOffsets(5, intensity, () => 1);
    expect(atMin.every((o) => o === -maxOffset)).toBe(true);
    expect(atMax.every((o) => o === maxOffset)).toBe(true);
  });

  it("기본 rng(Math.random)를 쓰면 매 호출마다 다른 값이 나온다", () => {
    const a = calculateBandOffsets(10, 1);
    const b = calculateBandOffsets(10, 1);
    expect(a).not.toEqual(b);
  });
});
