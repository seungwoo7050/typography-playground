import { getStyle } from "./registry";

/**
 * 유니코드 생성기의 유일한 공개 진입점. 알 수 없는 styleId가 오면
 * 조용히 실패하는 대신 원문을 그대로 반환한다 — UI 쪽에서 "존재하지
 * 않는 스타일"을 별도로 방어할 필요 없이 항상 안전한 문자열을 받는다.
 *
 * 실제 코드포인트 단위 순회는 각 스타일의 transform(mapTransform,
 * appendCombiningMark, zalgoTransform)이 이미 담당한다 — 이 함수는
 * 그 진입점을 하나로 모으는 얇은 래퍼다.
 */
export function applyStyle(input: string, styleId: string): string {
  const style = getStyle(styleId);
  if (!style) return input;
  return style.transform(input);
}
