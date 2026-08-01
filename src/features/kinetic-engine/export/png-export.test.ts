import { describe, expect, it } from "vitest";
import {
  PNG_EXPORT_SIZES,
  computeExportFontSize,
  sanitizeFilename,
} from "./png-export";

// exportPng/downloadBlob은 실제 canvas/toBlob/URL.createObjectURL이
// 필요해(jsdom 미구현) 여기서 테스트하지 않는다 — 실제 브라우저로
// 검증한다. 여기서는 DOM과 분리된 순수 함수와 데이터 무결성만 검증한다.

describe("PNG_EXPORT_SIZES", () => {
  it("id가 서로 고유하다", () => {
    const ids = PNG_EXPORT_SIZES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 크기가 양수 너비/높이를 가진다", () => {
    for (const size of PNG_EXPORT_SIZES) {
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
    }
  });
});

describe("computeExportFontSize", () => {
  it("기준 캔버스 폭(800)이면 기준 폰트 크기(120)를 그대로 쓴다", () => {
    expect(computeExportFontSize(800)).toBe(120);
  });

  it("2배 넓은 캔버스면 폰트 크기도 2배가 된다", () => {
    expect(computeExportFontSize(1600)).toBe(240);
  });

  it("더 좁은 캔버스면 폰트 크기가 비례해서 작아진다", () => {
    expect(computeExportFontSize(400)).toBe(60);
  });
});

describe("sanitizeFilename", () => {
  it("영숫자/공백은 그대로 둔다", () => {
    expect(sanitizeFilename("Hello World 123")).toBe("Hello World 123");
  });

  it("한글도 그대로 둔다", () => {
    expect(sanitizeFilename("안녕하세요")).toBe("안녕하세요");
  });

  it("경로 구분 문자를 언더스코어로 치환한다", () => {
    expect(sanitizeFilename("A/B:C")).toBe("A_B_C");
  });

  it("앞뒤 공백을 제거한다", () => {
    expect(sanitizeFilename("  padded  ")).toBe("padded");
  });

  it("50자를 넘으면 자른다", () => {
    const long = "a".repeat(100);
    expect(sanitizeFilename(long).length).toBe(50);
  });

  it("빈 문자열이나 공백만 있으면 untitled를 반환한다", () => {
    expect(sanitizeFilename("")).toBe("untitled");
    expect(sanitizeFilename("   ")).toBe("untitled");
  });
});
