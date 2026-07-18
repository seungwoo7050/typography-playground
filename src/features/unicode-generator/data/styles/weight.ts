import type { UnicodeStyleDefinition } from "../../lib/types";
import { buildAlphabetMap, buildDigitMap, mapTransform } from "./alphabet-map";

const boldAlphabet = buildAlphabetMap(0x1d400, 0x1d41a);
const boldDigits = buildDigitMap(0x1d7ce);

// 이탤릭 소문자 h는 U+1D455가 아니라 기존 PLANCK CONSTANT 심벌(U+210E)을
// 쓴다 — Mathematical Alphanumeric Symbols 블록에서 유일한 이탤릭 구멍.
// 이탤릭은 숫자 스타일이 정의되어 있지 않아 숫자는 그대로 통과한다.
const italicAlphabet = buildAlphabetMap(0x1d434, 0x1d44e, { h: 0x210e });

// 볼드이탤릭은 구멍이 없다. 숫자 스타일도 정의되어 있지 않다.
const boldItalicAlphabet = buildAlphabetMap(0x1d468, 0x1d482);

export const weightStyles: UnicodeStyleDefinition[] = [
  {
    id: "bold",
    label: "Bold",
    category: "weight",
    transform: mapTransform(boldAlphabet, boldDigits),
  },
  {
    id: "italic",
    label: "Italic",
    category: "weight",
    transform: mapTransform(italicAlphabet),
  },
  {
    id: "bold-italic",
    label: "Bold Italic",
    category: "weight",
    transform: mapTransform(boldItalicAlphabet),
  },
];
