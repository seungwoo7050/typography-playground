import { readFileSync } from "node:fs";
import path from "node:path";
import * as opentype from "opentype.js";
import { describe, expect, it } from "vitest";
import { KINETIC_FONTS } from "./font-loader";

// 카탈로그에 새 폰트를 넣기 전에 사람이 직접 하던 파싱 검증을 테스트로
// 옮겼다. opentype.js가 지원하지 않는 GSUB 룩업(lookupType 6)을 쓰는
// 폰트는 parse는 통과하고 두 글자 이상 getPath에서 예외를 던지므로
// (§font-loader.ts 카탈로그 주석), 파싱만이 아니라 여러 글자 경로까지
// 뽑아 본다. 한글 지원 폰트는 한글 음절도 함께 확인한다.
const LATIN_SAMPLE = "Hello";
const KOREAN_SAMPLE = "안녕하세요";

describe("KINETIC_FONTS 카탈로그", () => {
  it.each(KINETIC_FONTS.map((f) => [f.id, f] as const))(
    "%s: 원본을 파싱하고 여러 글자 아웃라인을 뽑을 수 있다",
    (_id, definition) => {
      const bytes = readFileSync(
        path.join(process.cwd(), "public", definition.sourcePath),
      );
      const buffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      );
      const font = opentype.parse(buffer);

      expect(font.getPath(LATIN_SAMPLE, 0, 0, 100).commands.length).toBeGreaterThan(0);
      if (definition.supportsKorean) {
        expect(font.getPath(KOREAN_SAMPLE, 0, 0, 100).commands.length).toBeGreaterThan(0);
      }
    },
    // 판-CJK 폰트(20MB대)는 파싱만 수 초가 걸릴 수 있다.
    30_000,
  );
});
