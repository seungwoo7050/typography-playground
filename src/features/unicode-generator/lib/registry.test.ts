import { describe, expect, it } from "vitest";
import { buildRegistry, getStyle, listCategories, listStyles, listStylesByCategory } from "./registry";
import { allStyles } from "../data/styles";
import type { UnicodeStyleDefinition } from "./types";

const dummy: UnicodeStyleDefinition = {
  id: "dummy",
  label: "Dummy",
  category: "weight",
  transform: (s) => s,
};

describe("buildRegistry", () => {
  it("중복된 id가 있으면 모듈 로드 시점에 예외를 던진다", () => {
    expect(() => buildRegistry([dummy, { ...dummy }])).toThrow(/중복된 유니코드 스타일 id/);
  });

  it("id가 고유하면 정상적으로 맵을 만든다", () => {
    const other: UnicodeStyleDefinition = { ...dummy, id: "dummy-2" };
    const map = buildRegistry([dummy, other]);
    expect(map.size).toBe(2);
  });
});

describe("실제 allStyles 레지스트리", () => {
  it("중복 id 없이 로드된다 (import 시점에 이미 검증됨)", () => {
    expect(listStyles().length).toBe(allStyles.length);
  });

  it("MVP 목표(15-20개)를 충족한다", () => {
    expect(allStyles.length).toBeGreaterThanOrEqual(15);
    expect(allStyles.length).toBeLessThanOrEqual(30);
  });

  it("getStyle은 존재하지 않는 id에 undefined를 반환한다", () => {
    expect(getStyle("존재하지-않음")).toBeUndefined();
  });

  it("getStyle은 존재하는 id에 정의를 반환한다", () => {
    expect(getStyle("bold")?.label).toBe("Bold");
  });

  it("listCategories는 중복 없는 카테고리 목록을 반환한다", () => {
    const categories = listCategories();
    expect(new Set(categories).size).toBe(categories.length);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("listStylesByCategory는 해당 카테고리만 필터링한다", () => {
    const weightStyles = listStylesByCategory("weight");
    expect(weightStyles.length).toBeGreaterThan(0);
    for (const style of weightStyles) {
      expect(style.category).toBe("weight");
    }
  });
});
