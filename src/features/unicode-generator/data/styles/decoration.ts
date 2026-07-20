import type { UnicodeStyleDefinition } from "../../lib/types";

/**
 * 취소선/밑줄은 매핑 테이블이 아니라 결합 문자(combining mark)를
 * 각 글자 뒤에 덧붙이는 방식이다 — 공백을 포함해 모든 문자 뒤에
 * 붙여야 줄이 끊기지 않고 이어진다(단어 사이만 끊기면 시각적으로
 * 부자연스럽다).
 */
function appendCombiningMark(mark: string): (input: string) => string {
  return (input: string) => {
    let result = "";
    for (const char of input) {
      result += char + mark;
    }
    return result;
  };
}

export const decorationStyles: UnicodeStyleDefinition[] = [
  {
    id: "strikethrough",
    label: "Strikethrough",
    category: "decoration",
    transform: appendCombiningMark("̶"), // COMBINING LONG STROKE OVERLAY
  },
  {
    id: "underline",
    label: "Underline",
    category: "decoration",
    transform: appendCombiningMark("̲"), // COMBINING LOW LINE
  },
];
