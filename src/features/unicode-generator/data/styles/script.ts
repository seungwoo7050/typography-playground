import type { UnicodeStyleDefinition } from "../../lib/types";
import { buildAlphabetMap, mapTransform } from "./alphabet-map";

// Mathematical Script(필기체)는 몇몇 글자가 이미 다른 위치에 레거시
// 심벌로 존재해 이 블록에 할당되지 않는다 — 대문자 B,E,F,H,I,L,M,R와
// 소문자 e,g,o가 구멍이다.
const scriptAlphabet = buildAlphabetMap(0x1d49c, 0x1d4b6, {
  B: 0x212c, // ℬ SCRIPT CAPITAL B
  E: 0x2130, // ℰ SCRIPT CAPITAL E
  F: 0x2131, // ℱ SCRIPT CAPITAL F
  H: 0x210b, // ℋ SCRIPT CAPITAL H
  I: 0x2110, // ℐ SCRIPT CAPITAL I
  L: 0x2112, // ℒ SCRIPT CAPITAL L
  M: 0x2133, // ℳ SCRIPT CAPITAL M
  R: 0x211b, // ℛ SCRIPT CAPITAL R
  e: 0x212f, // ℯ SCRIPT SMALL E
  g: 0x210a, // ℊ SCRIPT SMALL G
  o: 0x2134, // ℴ SCRIPT SMALL O
});

export const scriptStyles: UnicodeStyleDefinition[] = [
  {
    id: "script",
    label: "Script",
    category: "alphabet",
    transform: mapTransform(scriptAlphabet),
  },
];
