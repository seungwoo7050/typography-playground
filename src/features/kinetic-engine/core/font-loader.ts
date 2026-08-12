import * as opentype from "opentype.js";

export interface KineticFontDefinition {
  id: string;
  label: string;
  /** public/ 기준 상대 경로 — CSS self-host용 WOFF2가 아니라
   * opentype.js가 파싱할 수 있는 압축 안 된 TTF/OTF 원본이다. */
  sourcePath: string;
  /** 한글 음절 글리프를 실제로 담고 있는지 — FontPicker가 이 값으로
   * "영문"/"한글 지원" 두 그룹으로 나눠 보여준다(라틴 전용 폰트로
   * 한글을 입력하면 글리프가 없어 tofu 박스로 렌더링되므로, 고르기
   * 전에 구분할 수 있어야 한다). */
  supportsKorean: boolean;
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
  { id: "space-grotesk", label: "Space Grotesk", sourcePath: "/fonts/space-grotesk/source.ttf", supportsKorean: false },
  { id: "fraunces", label: "Fraunces", sourcePath: "/fonts/fraunces/source.ttf", supportsKorean: false },
  { id: "unbounded", label: "Unbounded", sourcePath: "/fonts/unbounded/source.ttf", supportsKorean: false },
  { id: "archivo-black", label: "Archivo Black", sourcePath: "/fonts/archivo-black/source.ttf", supportsKorean: false },
  { id: "big-shoulders", label: "Big Shoulders", sourcePath: "/fonts/big-shoulders/source.ttf", supportsKorean: false },
  { id: "anton", label: "Anton", sourcePath: "/fonts/anton/source.ttf", supportsKorean: false },
  { id: "righteous", label: "Righteous", sourcePath: "/fonts/righteous/source.ttf", supportsKorean: false },
  { id: "syne", label: "Syne", sourcePath: "/fonts/syne/source.ttf", supportsKorean: false },
  { id: "playfair-display", label: "Playfair Display", sourcePath: "/fonts/playfair-display/source.ttf", supportsKorean: false },
  { id: "bebas-neue", label: "Bebas Neue", sourcePath: "/fonts/bebas-neue/source.ttf", supportsKorean: false },
  { id: "poppins", label: "Poppins", sourcePath: "/fonts/poppins/source.ttf", supportsKorean: false },
  { id: "montserrat", label: "Montserrat", sourcePath: "/fonts/montserrat/source.ttf", supportsKorean: false },
  { id: "abril-fatface", label: "Abril Fatface", sourcePath: "/fonts/abril-fatface/source.ttf", supportsKorean: false },
  { id: "bungee", label: "Bungee", sourcePath: "/fonts/bungee/source.ttf", supportsKorean: false },
  { id: "monoton", label: "Monoton", sourcePath: "/fonts/monoton/source.ttf", supportsKorean: false },
  { id: "alfa-slab-one", label: "Alfa Slab One", sourcePath: "/fonts/alfa-slab-one/source.ttf", supportsKorean: false },
  { id: "staatliches", label: "Staatliches", sourcePath: "/fonts/staatliches/source.ttf", supportsKorean: false },
  { id: "dm-serif-display", label: "DM Serif Display", sourcePath: "/fonts/dm-serif-display/source.ttf", supportsKorean: false },
  { id: "sora", label: "Sora", sourcePath: "/fonts/sora/source.ttf", supportsKorean: false },
  { id: "zilla-slab", label: "Zilla Slab", sourcePath: "/fonts/zilla-slab/source.ttf", supportsKorean: false },
  // 한글 지원 폰트 20개 — 라틴 카탈로그와 개수를 맞췄다. "나눔"
  // 브랜딩은 google/fonts 전체에 5개뿐이라(git tree로 직접 확인)
  // 나머지 15개는 다른 한글 지원 구글 폰트로 채웠다 — 무작위가
  // 아니라 라틴 카탈로그와 같은 카테고리 다양성 기준(실용 UI
  // 산세리프/세리프/굵은 디스플레이/모던 산세리프/손글씨)으로
  // 선정했고, 전부 "Hello"/"안녕하세요"/"가나다라" 실제 파싱
  // 검증 완료(GSUB lookupType 6 문제 없음).
  //
  // 한글 완성형 음절 커버리지 때문에 원본 TTF가 대체로 2-8MB대로
  // 라틴 폰트보다 훨씬 무겁다 — 선택 시에만 로드되므로(loadKineticFont가
  // fontId별 지연 로드) 초기 번들에는 영향 없다. Noto Sans/Serif KR
  // (10.4MB/23.8MB, 판-CJK 커버리지)과 Stylish(10.9MB)는 그중에서도
  // 유독 무겁다 — 로딩 상태 피드백(§KineticPlayground.tsx)이 이미
  // 있어 완전히 무신호는 아니지만, 이 셋을 고르면 체감되는 로딩
  // 시간이 있을 수 있다는 걸 명시해둔다.
  { id: "nanum-brush-script", label: "Nanum Brush Script", sourcePath: "/fonts/nanum-brush-script/source.ttf", supportsKorean: true },
  { id: "nanum-pen-script", label: "Nanum Pen Script", sourcePath: "/fonts/nanum-pen-script/source.ttf", supportsKorean: true },
  { id: "nanum-gothic", label: "Nanum Gothic", sourcePath: "/fonts/nanum-gothic/source.ttf", supportsKorean: true },
  { id: "nanum-myeongjo", label: "Nanum Myeongjo", sourcePath: "/fonts/nanum-myeongjo/source.ttf", supportsKorean: true },
  { id: "nanum-gothic-coding", label: "Nanum Gothic Coding", sourcePath: "/fonts/nanum-gothic-coding/source.ttf", supportsKorean: true },
  { id: "noto-sans-kr", label: "Noto Sans KR", sourcePath: "/fonts/noto-sans-kr/source.ttf", supportsKorean: true },
  { id: "noto-serif-kr", label: "Noto Serif KR", sourcePath: "/fonts/noto-serif-kr/source.ttf", supportsKorean: true },
  { id: "gothic-a1", label: "Gothic A1", sourcePath: "/fonts/gothic-a1/source.ttf", supportsKorean: true },
  { id: "ibm-plex-sans-kr", label: "IBM Plex Sans KR", sourcePath: "/fonts/ibm-plex-sans-kr/source.ttf", supportsKorean: true },
  { id: "gowun-batang", label: "Gowun Batang", sourcePath: "/fonts/gowun-batang/source.ttf", supportsKorean: true },
  { id: "hahmlet", label: "Hahmlet", sourcePath: "/fonts/hahmlet/source.ttf", supportsKorean: true },
  { id: "black-han-sans", label: "Black Han Sans", sourcePath: "/fonts/black-han-sans/source.ttf", supportsKorean: true },
  { id: "do-hyeon", label: "Do Hyeon", sourcePath: "/fonts/do-hyeon/source.ttf", supportsKorean: true },
  { id: "jua", label: "Jua", sourcePath: "/fonts/jua/source.ttf", supportsKorean: true },
  { id: "gowun-dodum", label: "Gowun Dodum", sourcePath: "/fonts/gowun-dodum/source.ttf", supportsKorean: true },
  { id: "stylish", label: "Stylish", sourcePath: "/fonts/stylish/source.ttf", supportsKorean: true },
  { id: "gaegu", label: "Gaegu", sourcePath: "/fonts/gaegu/source.ttf", supportsKorean: true },
  { id: "poor-story", label: "Poor Story", sourcePath: "/fonts/poor-story/source.ttf", supportsKorean: true },
  { id: "east-sea-dokdo", label: "East Sea Dokdo", sourcePath: "/fonts/east-sea-dokdo/source.ttf", supportsKorean: true },
  { id: "song-myung", label: "Song Myung", sourcePath: "/fonts/song-myung/source.ttf", supportsKorean: true },
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
  // 캐시하지 않음). finally()는 원래 거부를 그대로 전달하는 새
  // Promise를 만들고 그 Promise에는 아무도 catch를 달지 않아, 호출자가
  // 실패를 처리해도 처리되지 않은 rejection이 하나 더 남았다 — 두
  // 경로 모두 핸들러를 달아 정리용 체인 자체는 항상 이행되게 한다.
  const clearInflight = () => {
    loadingPromises.delete(fontId);
  };
  promise.then(clearInflight, clearInflight);

  return promise;
}
