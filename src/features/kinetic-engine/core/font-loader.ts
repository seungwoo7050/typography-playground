import * as opentype from "opentype.js";

export interface KineticFontDefinition {
  id: string;
  label: string;
  /** public/ 기준 상대 경로 — CSS self-host용 WOFF2가 아니라
   * opentype.js가 파싱할 수 있는 압축 안 된 TTF/OTF 원본이다. */
  sourcePath: string;
}

// 파이프라인을 Space Grotesk 1개로 검증한 뒤, 라이선스 리스크 없이
// (전부 google/fonts의 ofl/ 디렉토리 = SIL OFL) 카탈로그를 확장했다.
// 새 폰트를 더 추가하려면 scripts/fetch-kinetic-fonts.mjs의
// KINETIC_FONT_MANIFEST에 항목을 더하고 다시 실행한 뒤, 여기 한 줄만
// 추가하면 된다 — 재아키텍처 불필요.
//
// 주의: 여기 추가하기 전에 반드시 opentype.js로 실제 파싱 검증할 것.
// Bricolage Grotesque, Space Mono, Instrument Serif, Chivo는 OFL
// 라이선스라 다운로드까지는 됐지만, opentype.js가 이 폰트들의 GSUB
// chained-context 치환 룩업(lookupType 6)을 지원하지 않아 두 글자
// 이상 텍스트에서 무조건 예외를 던져 제외했다 — 라이선스 문제가
// 아니라 렌더링 엔진 한계다.
export const KINETIC_FONTS: KineticFontDefinition[] = [
  { id: "space-grotesk", label: "Space Grotesk", sourcePath: "/fonts/space-grotesk/source.ttf" },
  { id: "fraunces", label: "Fraunces", sourcePath: "/fonts/fraunces/source.ttf" },
  { id: "unbounded", label: "Unbounded", sourcePath: "/fonts/unbounded/source.ttf" },
  { id: "archivo-black", label: "Archivo Black", sourcePath: "/fonts/archivo-black/source.ttf" },
  { id: "big-shoulders", label: "Big Shoulders", sourcePath: "/fonts/big-shoulders/source.ttf" },
  { id: "anton", label: "Anton", sourcePath: "/fonts/anton/source.ttf" },
  { id: "righteous", label: "Righteous", sourcePath: "/fonts/righteous/source.ttf" },
  { id: "syne", label: "Syne", sourcePath: "/fonts/syne/source.ttf" },
  { id: "playfair-display", label: "Playfair Display", sourcePath: "/fonts/playfair-display/source.ttf" },
  { id: "bebas-neue", label: "Bebas Neue", sourcePath: "/fonts/bebas-neue/source.ttf" },
  { id: "poppins", label: "Poppins", sourcePath: "/fonts/poppins/source.ttf" },
  { id: "montserrat", label: "Montserrat", sourcePath: "/fonts/montserrat/source.ttf" },
  { id: "abril-fatface", label: "Abril Fatface", sourcePath: "/fonts/abril-fatface/source.ttf" },
  { id: "bungee", label: "Bungee", sourcePath: "/fonts/bungee/source.ttf" },
  { id: "monoton", label: "Monoton", sourcePath: "/fonts/monoton/source.ttf" },
  { id: "alfa-slab-one", label: "Alfa Slab One", sourcePath: "/fonts/alfa-slab-one/source.ttf" },
  { id: "staatliches", label: "Staatliches", sourcePath: "/fonts/staatliches/source.ttf" },
  { id: "dm-serif-display", label: "DM Serif Display", sourcePath: "/fonts/dm-serif-display/source.ttf" },
  { id: "sora", label: "Sora", sourcePath: "/fonts/sora/source.ttf" },
  { id: "zilla-slab", label: "Zilla Slab", sourcePath: "/fonts/zilla-slab/source.ttf" },
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
