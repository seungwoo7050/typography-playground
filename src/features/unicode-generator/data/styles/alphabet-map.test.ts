import { describe, expect, it } from "vitest";
import { buildAlphabetMap, buildDigitMap, mapTransform } from "./alphabet-map";

describe("buildAlphabetMap", () => {
  it("대문자/소문자를 베이스 오프셋 + 인덱스로 생성한다", () => {
    const map = buildAlphabetMap(0x1d400, 0x1d41a); // Mathematical Bold
    expect(map.get("A")).toBe("\u{1d400}");
    expect(map.get("Z")).toBe("\u{1d419}");
    expect(map.get("a")).toBe("\u{1d41a}");
    expect(map.get("z")).toBe("\u{1d433}");
  });

  it("holes로 지정한 글자는 베이스 오프셋 대신 지정된 코드포인트를 쓴다", () => {
    const map = buildAlphabetMap(0x1d434, 0x1d44e, { h: 0x210e });
    expect(map.get("h")).toBe("ℎ");
    expect(map.get("g")).toBe("\u{1d454}"); // 구멍이 아닌 글자는 정상 오프셋
  });
});

describe("buildDigitMap", () => {
  it("0-9를 베이스 오프셋으로 생성한다", () => {
    const map = buildDigitMap(0x1d7ce);
    expect(map.get("0")).toBe("\u{1d7ce}");
    expect(map.get("9")).toBe("\u{1d7d7}");
  });
});

describe("mapTransform", () => {
  const boldAlphabet = buildAlphabetMap(0x1d400, 0x1d41a);
  const boldDigits = buildDigitMap(0x1d7ce);
  const bold = mapTransform(boldAlphabet, boldDigits);

  it("매핑에 없는 문자(공백, 구두점)는 그대로 통과시킨다", () => {
    expect(bold("A B, C!")).toBe("\u{1d400} \u{1d401}, \u{1d402}!");
  });

  it("서로게이트 페어(이모지)를 깨뜨리지 않고 그대로 통과시킨다", () => {
    // "😀"는 UTF-16에서 서로게이트 페어(두 코드유닛)로 인코딩된다.
    // 코드유닛 단위로 순회했다면 이 문자가 깨져서 물음표/깨진 문자로
    // 나왔을 것이다 — for...of 코드포인트 순회 덕에 온전히 보존된다.
    const input = "A😀B";
    const result = bold(input);
    expect(result).toBe("\u{1d400}😀\u{1d401}");
    // 결과 문자열의 코드포인트 개수가 입력과 같아야 한다(깨지지 않음).
    expect([...result].length).toBe([...input].length);
  });

  it("여러 맵 중 먼저 매치되는 것을 사용한다", () => {
    const first = mapTransform(new Map([["x", "1"]]), new Map([["x", "2"]]));
    expect(first("x")).toBe("1");
  });
});
