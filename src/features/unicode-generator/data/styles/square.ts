import type { UnicodeStyleDefinition } from "../../lib/types";
import { buildAlphabetMap, mapTransform } from "./alphabet-map";

// Enclosed Alphanumeric Supplement의 사각형 문자는 대문자용
// SQUARED LATIN CAPITAL LETTER만 유니코드에 존재하고 소문자 전용
// 사각형 글자는 없다 — bubble-filled와 같은 이유로 대/소문자 입력
// 모두 같은 사각형 대문자 글자에 매핑한다. 숫자용 사각 문자는
// 유니코드에 없어 지원하지 않는다.
const squareAlphabet = buildAlphabetMap(0x1f130, 0x1f130);

export const squareStyles: UnicodeStyleDefinition[] = [
  {
    id: "square",
    label: "Square",
    category: "enclosed",
    transform: mapTransform(squareAlphabet),
  },
];
