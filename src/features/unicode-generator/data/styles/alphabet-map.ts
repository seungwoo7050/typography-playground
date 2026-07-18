/**
 * 유니코드 Mathematical Alphanumeric Symbols 블록(U+1D400–U+1D7FF) 헬퍼.
 *
 * 이 블록은 영문 대문자 A-Z(26) + 소문자 a-z(26) = 52개 코드포인트를
 * 스타일마다 연속된 구간에 배치한다(볼드 → 이탤릭 → 볼드이탤릭 →
 * 스크립트 → ... 순서로 0x34(52)씩 증가). 숫자 0-9는 별도 구간에
 * 10개씩 배치된다.
 *
 * 일부 스타일(이탤릭, 스크립트, 프락투어, 더블스트럭)은 특정 글자가
 * 이미 다른 위치에 legacy 심벌로 존재해 이 블록에 할당되지 않는
 * "구멍"이 있다 — 예: 이탤릭 소문자 h는 U+1D455가 아니라 기존
 * PLANCK CONSTANT 심벌 U+210E를 쓴다. 구멍은 holes로 개별 지정한다.
 */
export function buildAlphabetMap(
  capitalBase: number,
  lowerBase: number,
  holes: Partial<Record<string, number>> = {},
): Map<string, string> {
  const map = new Map<string, string>();
  for (let i = 0; i < 26; i++) {
    const upper = String.fromCharCode(65 + i); // 'A'..'Z'
    const lower = String.fromCharCode(97 + i); // 'a'..'z'
    map.set(upper, String.fromCodePoint(holes[upper] ?? capitalBase + i));
    map.set(lower, String.fromCodePoint(holes[lower] ?? lowerBase + i));
  }
  return map;
}

export function buildDigitMap(base: number): Map<string, string> {
  const map = new Map<string, string>();
  for (let i = 0; i < 10; i++) {
    map.set(String(i), String.fromCodePoint(base + i));
  }
  return map;
}

/**
 * 여러 문자 맵을 순서대로 시도하는 변환 함수를 만든다. 어떤 맵에도
 * 없는 문자(공백, 구두점, 원래부터 Latin이 아닌 문자)는 그대로 둔다.
 *
 * `for...of`로 문자열을 순회하면 서로게이트 페어를 포함해 유니코드
 * 코드포인트 단위로 순회된다(UTF-16 코드유닛 단위 순회가 아님) — 이
 * 헬퍼를 쓰는 모든 스타일이 자동으로 이 안전성을 얻는다.
 */
export function mapTransform(
  ...maps: Map<string, string>[]
): (input: string) => string {
  return (input: string) => {
    let result = "";
    for (const char of input) {
      let mapped: string | undefined;
      for (const map of maps) {
        mapped = map.get(char);
        if (mapped !== undefined) break;
      }
      result += mapped ?? char;
    }
    return result;
  };
}
