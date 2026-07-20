import type { UnicodeStyleDefinition } from "../../lib/types";
import { mapTransform } from "./alphabet-map";

/**
 * 전통적인 활자 의미의 스몰캡스: 대문자는 이미 대문자이므로 그대로
 * 두고, 소문자만 "작은 대문자" 모양 글자로 바꾼다. 유니코드
 * Latin Letter Small Capital 문자들은 IPA Extensions, Phonetic
 * Extensions, Latin Extended-D 등 여러 블록에 흩어져 있어 —
 * UnicodeData.txt에서 "LATIN LETTER SMALL CAPITAL *" 이름을 직접
 * 조회해 검증했다.
 *
 * x는 유니코드에 작은 대문자 글자가 존재하지 않아 원문 그대로
 * 통과한다(생김새 자체가 대소문자 차이가 거의 없어 실용적으로도
 * 문제되지 않음).
 */
const smallCapsMap = new Map<string, string>([
  ["a", "ᴀ"],
  ["b", "ʙ"],
  ["c", "ᴄ"],
  ["d", "ᴅ"],
  ["e", "ᴇ"],
  ["f", "\u{a730}"],
  ["g", "ɢ"],
  ["h", "ʜ"],
  ["i", "ɪ"],
  ["j", "ᴊ"],
  ["k", "ᴋ"],
  ["l", "ʟ"],
  ["m", "ᴍ"],
  ["n", "ɴ"],
  ["o", "ᴏ"],
  ["p", "ᴘ"],
  ["q", "\u{a7af}"],
  ["r", "ʀ"],
  ["s", "\u{a731}"],
  ["t", "ᴛ"],
  ["u", "ᴜ"],
  ["v", "ᴠ"],
  ["w", "ᴡ"],
  // x: 유니코드에 대응 문자 없음
  ["y", "ʏ"],
  ["z", "ᴢ"],
]);

export const smallCapsStyles: UnicodeStyleDefinition[] = [
  {
    id: "small-caps",
    label: "Small Caps",
    category: "weight",
    transform: mapTransform(smallCapsMap),
  },
];
