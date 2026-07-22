import { describe, expect, it } from "vitest";
import { applyStyle } from "./transform";

describe("applyStyle", () => {
  it("존재하는 styleId면 해당 스타일로 변환한다", () => {
    expect(applyStyle("AB", "bold")).toBe("\u{1d400}\u{1d401}");
  });

  it("존재하지 않는 styleId면 원문을 그대로 반환한다", () => {
    expect(applyStyle("Hello", "존재하지-않음")).toBe("Hello");
  });

  it("빈 문자열도 그대로 처리한다", () => {
    expect(applyStyle("", "bold")).toBe("");
  });
});
