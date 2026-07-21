import type { UnicodeStyleDefinition } from "../../lib/types";

/**
 * 잘고(zalgo) 텍스트는 Combining Diacritical Marks 블록(U+0300–U+036F)의
 * 결합 문자를 글자 위/아래/관통 위치에 무작위로 여러 겹 쌓아 만든다.
 * 알파벳 매핑과 달리 "정답 글리프"가 없는 효과라(어떤 결합 문자를
 * 골라도 유효한 유니코드다) 정확성 리스크가 낮다 — 다만 보이지 않는
 * 문자(COMBINING GRAPHEME JOINER 등)와 기술적 성조 기호는 시각 효과에
 * 도움이 안 돼 제외했다.
 */
const ABOVE_MARKS = [
  "̀",
  "́",
  "̂",
  "̃",
  "̄",
  "̅",
  "̆",
  "̇",
  "̈",
  "̉",
  "̊",
  "̋",
  "̌",
  "̍",
  "̎",
  "̏",
  "̐",
  "̑",
  "̒",
  "̓",
  "̔",
  "̕",
  "̚",
  "̽",
  "̾",
  "̿",
  "͂",
  "̈́",
  "ͅ",
  "͐",
  "͑",
  "͗",
  "͘",
  "͛",
];

const BELOW_MARKS = [
  "̖",
  "̗",
  "̘",
  "̙",
  "̜",
  "̝",
  "̞",
  "̟",
  "̠",
  "̡",
  "̢",
  "̣",
  "̤",
  "̥",
  "̦",
  "̧",
  "̨",
  "̩",
  "̪",
  "̫",
  "̬",
  "̭",
  "̮",
  "̯",
  "̰",
  "̱",
  "̲",
  "̳",
  "̹",
  "̺",
  "̻",
  "̼",
  "͇",
  "͈",
  "͉",
  "͓",
  "͔",
  "͕",
  "͖",
  "͙",
  "͚",
  "͜",
  "͟",
];

const OVERLAY_MARKS = ["̴", "̵", "̶", "̷", "̸"];

interface ZalgoIntensity {
  min: number;
  max: number;
}

function randomInRange(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickRandomMarks(pool: string[], count: number): string {
  let result = "";
  for (let i = 0; i < count; i++) {
    result += pool[Math.floor(Math.random() * pool.length)];
  }
  return result;
}

function zalgoTransform(intensity: ZalgoIntensity): (input: string) => string {
  return (input: string) => {
    let result = "";
    for (const char of input) {
      // 공백엔 결합 문자를 붙이지 않는다 — 단어 사이 여백을 유지해
      // 텍스트가 완전히 뭉개지지 않게 한다.
      if (char === " " || char === "\n") {
        result += char;
        continue;
      }
      const aboveCount = randomInRange(intensity.min, intensity.max);
      const belowCount = randomInRange(intensity.min, intensity.max);
      const midCount = randomInRange(0, Math.ceil(intensity.max / 2));
      result +=
        char +
        pickRandomMarks(ABOVE_MARKS, aboveCount) +
        pickRandomMarks(BELOW_MARKS, belowCount) +
        pickRandomMarks(OVERLAY_MARKS, midCount);
    }
    return result;
  };
}

export const zalgoStyles: UnicodeStyleDefinition[] = [
  {
    id: "zalgo-low",
    label: "Zalgo (Low)",
    category: "glitch",
    transform: zalgoTransform({ min: 1, max: 2 }),
  },
  {
    id: "zalgo-medium",
    label: "Zalgo (Medium)",
    category: "glitch",
    transform: zalgoTransform({ min: 3, max: 6 }),
  },
  {
    id: "zalgo-high",
    label: "Zalgo (High)",
    category: "glitch",
    transform: zalgoTransform({ min: 6, max: 12 }),
  },
];
