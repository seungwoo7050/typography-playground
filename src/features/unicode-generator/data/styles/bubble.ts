import type { UnicodeStyleDefinition } from "../../lib/types";
import { buildAlphabetMap, mapTransform } from "./alphabet-map";

/**
 * Enclosed Alphanumerics 블록의 동그라미 숫자는 0이 1-9와 떨어진
 * 위치에 있다(0-9가 연속되지 않음) — 별도 처리.
 */
function buildCircledDigitMap(
  zeroCodepoint: number,
  oneToNineBase: number,
): Map<string, string> {
  const map = new Map<string, string>();
  map.set("0", String.fromCodePoint(zeroCodepoint));
  for (let i = 1; i <= 9; i++) {
    map.set(String(i), String.fromCodePoint(oneToNineBase + (i - 1)));
  }
  return map;
}

// 외곽선(흰색) 동그라미: 대문자 Ⓐ-Ⓩ(U+24B6-), 소문자 ⓐ-ⓩ(U+24D0-),
// 숫자 ⓪(U+24EA) + ①-⑨(U+2460-).
const bubbleOutlineAlphabet = buildAlphabetMap(0x24b6, 0x24d0);
const bubbleOutlineDigits = buildCircledDigitMap(0x24ea, 0x2460);

// 채움(검은 바탕) 동그라미: 대문자용 NEGATIVE CIRCLED LATIN CAPITAL
// LETTER만 유니코드에 존재하고 소문자 전용 채움 글자는 없다 — 대문자/
// 소문자 입력 모두 같은 대문자 채움 글자에 매핑한다(실제 서비스들의
// 관행과 동일). 숫자는 ⓿(U+24FF) + ➊-➒(U+2776-, Dingbats 블록).
const bubbleFilledAlphabet = buildAlphabetMap(0x1f150, 0x1f150);
const bubbleFilledDigits = buildCircledDigitMap(0x24ff, 0x2776);

export const bubbleStyles: UnicodeStyleDefinition[] = [
  {
    id: "bubble-outline",
    label: "Bubble Outline",
    category: "enclosed",
    transform: mapTransform(bubbleOutlineAlphabet, bubbleOutlineDigits),
  },
  {
    id: "bubble-filled",
    label: "Bubble Filled",
    category: "enclosed",
    transform: mapTransform(bubbleFilledAlphabet, bubbleFilledDigits),
  },
];
