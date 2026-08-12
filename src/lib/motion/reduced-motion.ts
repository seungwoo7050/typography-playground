/** prefers-reduced-motion: reduce 여부를 동기적으로 확인한다 —
 * CSS transition/animation은 globals.css의 전역 미디어 쿼리 하나로
 * 무력화되지만, 매 프레임 style.transform을 직접 대입하는 rAF
 * 루프(마그네틱 호버, 커스텀 커서, 스크롤 패럴랙스)는 CSS로 잡을
 * 수 없어 이 함수로 각 훅 내부에서 분기한다. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
