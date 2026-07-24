import * as opentype from "opentype.js";

export interface KineticFontDefinition {
  id: string;
  label: string;
  /** public/ 기준 상대 경로 — CSS self-host용 WOFF2가 아니라
   * opentype.js가 파싱할 수 있는 압축 안 된 TTF/OTF 원본이다. */
  sourcePath: string;
}

// MVP는 1개 폰트로 시작 — 파이프라인이 검증되면 카탈로그를 늘린다
// (scripts/fetch-kinetic-fonts.mjs로 원본 TTF를 추가로 받아온 뒤
// 여기 등록하면 된다, 재아키텍처 불필요).
export const KINETIC_FONTS: KineticFontDefinition[] = [
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    sourcePath: "/fonts/space-grotesk/source.ttf",
  },
];

const fontCache = new Map<string, opentype.Font>();
const loadingPromises = new Map<string, Promise<opentype.Font>>();

/**
 * 폰트를 fetch + 파싱해 opentype.js Font 객체로 반환한다. 같은
 * fontId를 다시 요청하면 캐시된 결과를 즉시 반환하고, 동시에 여러
 * 곳에서 요청해도 파싱이 중복 실행되지 않는다(진행 중인 Promise를
 * 공유).
 */
export function loadKineticFont(fontId: string): Promise<opentype.Font> {
  const cached = fontCache.get(fontId);
  if (cached) return Promise.resolve(cached);

  const inflight = loadingPromises.get(fontId);
  if (inflight) return inflight;

  const definition = KINETIC_FONTS.find((f) => f.id === fontId);
  if (!definition) {
    return Promise.reject(new Error(`알 수 없는 키네틱 폰트 id: ${fontId}`));
  }

  const promise = (async () => {
    const res = await fetch(definition.sourcePath);
    if (!res.ok) {
      throw new Error(
        `폰트 로드 실패 (${definition.sourcePath}): ${res.status}`,
      );
    }
    const buffer = await res.arrayBuffer();
    const font = opentype.parse(buffer);
    fontCache.set(fontId, font);
    return font;
  })();

  loadingPromises.set(fontId, promise);
  // 성공/실패 관계없이 완료되면 in-flight 목록에서 제거 — 실패 시
  // 다음 호출이 재시도할 수 있게 한다(영구히 거부된 Promise를
  // 캐시하지 않음).
  promise.finally(() => loadingPromises.delete(fontId));

  return promise;
}
