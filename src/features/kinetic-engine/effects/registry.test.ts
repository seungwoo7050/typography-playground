import { describe, expect, it } from "vitest";
import { allEffects } from "./index";
import { buildRegistry, getEffect, listEffects } from "./registry";
import type { EffectDefinition } from "./types";

const dummy: EffectDefinition = {
  id: "dummy",
  label: "Dummy",
  renderTarget: "canvas2d",
  defaultParams: {},
  paramSchema: {},
  supportsSvgExport: false,
};

describe("buildRegistry", () => {
  it("중복된 id가 있으면 예외를 던진다", () => {
    expect(() => buildRegistry([dummy, { ...dummy }])).toThrow(
      /중복된 이펙트 id/,
    );
  });

  it("id가 고유하면 정상적으로 맵을 만든다", () => {
    const other: EffectDefinition = { ...dummy, id: "dummy-2" };
    const map = buildRegistry([dummy, other]);
    expect(map.size).toBe(2);
  });
});

describe("실제 allEffects 레지스트리", () => {
  it("중복 id 없이 로드된다 (import 시점에 이미 검증됨)", () => {
    expect(listEffects().length).toBe(allEffects.length);
  });

  it("getEffect는 존재하지 않는 id에 undefined를 반환한다", () => {
    expect(getEffect("존재하지-않음")).toBeUndefined();
  });
});
