import type { UnicodeStyleDefinition } from "../../lib/types";
import { buildAlphabetMap, mapTransform } from "./alphabet-map";

// Mathematical Fraktur(고딕/블랙레터)는 대문자 C,H,I,R,Z가 구멍 —
// 이미 다른 위치에 레거시 심벌로 존재한다. 소문자는 구멍이 없다.
const gothicAlphabet = buildAlphabetMap(0x1d504, 0x1d51e, {
  C: 0x212d, // ℭ BLACK-LETTER CAPITAL C
  H: 0x210c, // ℌ BLACK-LETTER CAPITAL H
  I: 0x2111, // ℑ BLACK-LETTER CAPITAL I
  R: 0x211c, // ℜ BLACK-LETTER CAPITAL R
  Z: 0x2128, // ℨ BLACK-LETTER CAPITAL Z
});

export const gothicStyles: UnicodeStyleDefinition[] = [
  {
    id: "gothic",
    label: "Gothic",
    category: "alphabet",
    transform: mapTransform(gothicAlphabet),
  },
];
