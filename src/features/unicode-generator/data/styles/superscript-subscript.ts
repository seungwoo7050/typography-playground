import type { UnicodeStyleDefinition } from "../../lib/types";
import { mapTransform } from "./alphabet-map";

/**
 * 위첨자/아래첨자는 Mathematical Alphanumeric Symbols처럼 연속된
 * 블록이 아니라, 여러 블록(Superscripts and Subscripts, Spacing
 * Modifier Letters, Phonetic Extensions, Latin Extended-D/G...)에
 * 흩어진 "존재하는 것만 존재하는" 호환 문자 집합이다 — 26자 전체가
 * 채워져 있지 않다. 기억에 의존한 나열은 오류 위험이 커서, 유니코드
 * 컨소시엄 공식 UnicodeData.txt의 <super>/<sub> 분해 필드를 직접
 * 조회해 검증된 값만 사용했다(unicode.org/Public/UCD/latest/ucd/).
 *
 * 위첨자 대문자 X, Y, Z와 아래첨자 b, c, d, f, g, q, 그리고 아래첨자
 * 대문자 전체는 유니코드에 대응 문자가 아예 없다 — 이 글자들은
 * 원래 문자 그대로 통과한다(억지로 가까운 문자를 대체하지 않음).
 *
 * 위첨자 q(U+107A5)는 2022년 제정된 Unicode 14의 Latin Extended-G
 * 블록이라 일부 폰트/OS에서 미지원 글리프(각진 네모)로 보일 수 있다 —
 * 알려진 제약으로 남겨둔다.
 */
const superscriptMap = new Map<string, string>([
  ["0", "⁰"],
  ["1", "¹"],
  ["2", "²"],
  ["3", "³"],
  ["4", "⁴"],
  ["5", "⁵"],
  ["6", "⁶"],
  ["7", "⁷"],
  ["8", "⁸"],
  ["9", "⁹"],
  ["a", "ᵃ"],
  ["b", "ᵇ"],
  ["c", "ᶜ"],
  ["d", "ᵈ"],
  ["e", "ᵉ"],
  ["f", "ᶠ"],
  ["g", "ᵍ"],
  ["h", "ʰ"],
  ["i", "ⁱ"],
  ["j", "ʲ"],
  ["k", "ᵏ"],
  ["l", "ˡ"],
  ["m", "ᵐ"],
  ["n", "ⁿ"],
  ["o", "ᵒ"],
  ["p", "ᵖ"],
  ["q", "\u{107a5}"],
  ["r", "ʳ"],
  ["s", "ˢ"],
  ["t", "ᵗ"],
  ["u", "ᵘ"],
  ["v", "ᵛ"],
  ["w", "ʷ"],
  ["x", "ˣ"],
  ["y", "ʸ"],
  ["z", "ᶻ"],
  ["A", "ᴬ"],
  ["B", "ᴮ"],
  ["C", "\u{a7f2}"],
  ["D", "ᴰ"],
  ["E", "ᴱ"],
  ["F", "\u{a7f3}"],
  ["G", "ᴳ"],
  ["H", "ᴴ"],
  ["I", "ᴵ"],
  ["J", "ᴶ"],
  ["K", "ᴷ"],
  ["L", "ᴸ"],
  ["M", "ᴹ"],
  ["N", "ᴺ"],
  ["O", "ᴼ"],
  ["P", "ᴾ"],
  ["Q", "\u{a7f4}"],
  ["R", "ᴿ"],
  ["S", "\u{a7f1}"],
  ["T", "ᵀ"],
  ["U", "ᵁ"],
  ["V", "ⱽ"],
  ["W", "ᵂ"],
  // X, Y, Z: 유니코드에 위첨자 대문자가 존재하지 않아 원문 그대로 통과
]);

/** 아래첨자 대문자는 유니코드에 전혀 존재하지 않는다 — 소문자/숫자만. */
const subscriptMap = new Map<string, string>([
  ["0", "₀"],
  ["1", "₁"],
  ["2", "₂"],
  ["3", "₃"],
  ["4", "₄"],
  ["5", "₅"],
  ["6", "₆"],
  ["7", "₇"],
  ["8", "₈"],
  ["9", "₉"],
  ["a", "ₐ"],
  ["e", "ₑ"],
  ["h", "ₕ"],
  ["i", "ᵢ"],
  ["j", "ⱼ"],
  ["k", "ₖ"],
  ["l", "ₗ"],
  ["m", "ₘ"],
  ["n", "ₙ"],
  ["o", "ₒ"],
  ["p", "ₚ"],
  ["r", "ᵣ"],
  ["s", "ₛ"],
  ["t", "ₜ"],
  ["u", "ᵤ"],
  ["v", "ᵥ"],
  ["w", "₝"],
  ["x", "ₓ"],
  ["y", "₞"],
  ["z", "₟"],
  // b, c, d, f, g, q 및 모든 대문자: 유니코드에 대응 문자 없음, 원문 통과
]);

export const superscriptSubscriptStyles: UnicodeStyleDefinition[] = [
  {
    id: "superscript",
    label: "Superscript",
    category: "transform",
    transform: mapTransform(superscriptMap),
  },
  {
    id: "subscript",
    label: "Subscript",
    category: "transform",
    transform: mapTransform(subscriptMap),
  },
];
