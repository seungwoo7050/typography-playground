import type { UnicodeStyleDefinition } from "../../lib/types";
import { buildAlphabetMap, buildDigitMap, mapTransform } from "./alphabet-map";

// Halfwidth and Fullwidth Forms 블록 — 구멍 없이 완전한 연속 구간.
const fullwidthAlphabet = buildAlphabetMap(0xff21, 0xff41);
const fullwidthDigits = buildDigitMap(0xff10);

export const fullwidthStyles: UnicodeStyleDefinition[] = [
  {
    id: "fullwidth",
    label: "Fullwidth",
    category: "alphabet",
    transform: mapTransform(fullwidthAlphabet, fullwidthDigits),
  },
];
