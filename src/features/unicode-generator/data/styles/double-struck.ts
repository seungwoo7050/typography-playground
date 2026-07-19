import type { UnicodeStyleDefinition } from "../../lib/types";
import { buildAlphabetMap, buildDigitMap, mapTransform } from "./alphabet-map";

// Mathematical Double-Struck(블랙보드 볼드)은 대문자 C,H,N,P,Q,R,Z가
// 구멍 — 이미 다른 위치에 레거시 심벌(ℂ ℍ ℕ ℙ ℚ ℝ ℤ)로 존재한다.
// 소문자는 구멍이 없다.
const doubleStruckAlphabet = buildAlphabetMap(0x1d538, 0x1d552, {
  C: 0x2102,
  H: 0x210d,
  N: 0x2115,
  P: 0x2119,
  Q: 0x211a,
  R: 0x211d,
  Z: 0x2124,
});
const doubleStruckDigits = buildDigitMap(0x1d7d8);

export const doubleStruckStyles: UnicodeStyleDefinition[] = [
  {
    id: "double-struck",
    label: "Double-Struck",
    category: "alphabet",
    transform: mapTransform(doubleStruckAlphabet, doubleStruckDigits),
  },
];
