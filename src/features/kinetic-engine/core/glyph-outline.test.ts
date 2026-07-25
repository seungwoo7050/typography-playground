import { readFileSync } from "node:fs";
import path from "node:path";
import * as opentype from "opentype.js";
import { describe, expect, it } from "vitest";
import { extractGlyphOutline } from "./glyph-outline";

// outlineToPath2D는 브라우저의 실제 Path2D API가 필요해(jsdom은
// canvas를 구현하지 않음) 여기서 유닛 테스트하지 않는다 — Playwright
// 스크린샷 회귀로 검증한다(§계획서 테스트 전략).

const FONT_PATH = path.join(
  process.cwd(),
  "public/fonts/space-grotesk/source.ttf",
);

function loadTestFont(): opentype.Font {
  const bytes = readFileSync(FONT_PATH);
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  return opentype.parse(arrayBuffer);
}

describe("extractGlyphOutline", () => {
  const font = loadTestFont();

  it("커맨드와 바운딩 박스를 반환한다", () => {
    const outline = extractGlyphOutline(font, "Ag", 100);
    expect(outline.commands.length).toBeGreaterThan(0);
    expect(outline.fontSize).toBe(100);
    expect(outline.bbox.x2).toBeGreaterThan(outline.bbox.x1);
  });

  it("상승부(ascender)는 음수 y, 베이스라인은 0 근처다 — 캔버스 좌표계로 이미 변환되어 있음", () => {
    const outline = extractGlyphOutline(font, "A", 100);
    // 대문자 A는 하강부가 없으므로 bbox.y1(위쪽 끝)이 음수여야 하고
    // bbox.y2(아래쪽 끝, 베이스라인)는 0에 가까워야 한다.
    expect(outline.bbox.y1).toBeLessThan(0);
    expect(outline.bbox.y2).toBeCloseTo(0, 0);
  });

  it("빈 문자열은 빈 커맨드 배열을 반환한다", () => {
    const outline = extractGlyphOutline(font, "", 100);
    expect(outline.commands.length).toBe(0);
  });

  it("fontSize가 클수록 바운딩 박스도 비례해서 커진다", () => {
    const small = extractGlyphOutline(font, "A", 50);
    const large = extractGlyphOutline(font, "A", 100);
    const smallWidth = small.bbox.x2 - small.bbox.x1;
    const largeWidth = large.bbox.x2 - large.bbox.x1;
    expect(largeWidth).toBeCloseTo(smallWidth * 2, 0);
  });
});
