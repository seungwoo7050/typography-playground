// 키네틱 엔진(Tier 2)의 opentype.js 파서용 원본 TTF를 내려받는 스크립트.
//
// 왜 별도 스크립트인가: fetch-fonts.mjs가 받는 WOFF2는 CSS @font-face
// self-host용이다. opentype.js는 WOFF2(Brotli 압축)를 직접 파싱하지
// 못한다 — 파싱 시도 시 "WOFF2 require an external decompressor
// library"로 명시적으로 실패한다(opentype.js 2.0.0 소스 확인).
// 별도 압축 해제 라이브러리를 런타임 의존성으로 추가하는 대신, 같은
// google/fonts 저장소가 이미 갖고 있는 압축 안 된 원본 TTF를 별도로
// 받는 쪽이 더 단순하고 의존성이 적다.
//
// google/fonts의 많은 패밀리는 가변 폰트(variable font, 파일명에
// [wght] 같은 축 표기가 붙는다)로 배포된다 — opentype.js는 가변
// 폰트를 파싱은 하지만 배리에이션 인스턴싱을 지원하지 않아, 기본
// 인스턴스(보통 Regular/400)의 아웃라인만 가져온다. MVP는 이 기본
// 인스턴스로 충분하다.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "..", "public", "fonts");

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/**
 * repoFile은 google/fonts 저장소의 ofl/<repoSlug>/ 안에 있는 정확한
 * 파일명이다(가변 폰트는 대괄호 축 표기 포함, 리포에서 직접 확인
 * 필요 — 짐작하지 않는다).
 */
// 4개 제외됨(다운로드 후 opentype.js로 실제 파싱 검증하다 발견):
// bricolage-grotesque, space-mono, instrument-serif, chivo. 전부
// "substitutionType lookupType: 6 - substFormat: N is not yet
// supported" 예외를 던진다 — opentype.js가 GSUB의 chained-context
// 치환 룩업(타입 6)을 지원하지 않는데, 이 4개 폰트는 이 룩업이
// GSUB 테이블에 있어서 단일 문자는 되지만 두 글자 이상은 무조건
// 실패한다. 라이선스 문제가 아니라 렌더링 엔진의 한계 — 다시
// 추가하지 않는다.
const KINETIC_FONT_MANIFEST = [
  { slug: "space-grotesk", repoSlug: "spacegrotesk", repoFile: "SpaceGrotesk[wght].ttf" },
  { slug: "fraunces", repoSlug: "fraunces", repoFile: "Fraunces[SOFT,WONK,opsz,wght].ttf" },
  { slug: "unbounded", repoSlug: "unbounded", repoFile: "Unbounded[wght].ttf" },
  { slug: "archivo-black", repoSlug: "archivoblack", repoFile: "ArchivoBlack-Regular.ttf" },
  { slug: "big-shoulders", repoSlug: "bigshoulders", repoFile: "BigShoulders[opsz,wght].ttf" },
  { slug: "anton", repoSlug: "anton", repoFile: "Anton-Regular.ttf" },
  { slug: "righteous", repoSlug: "righteous", repoFile: "Righteous-Regular.ttf" },
  { slug: "syne", repoSlug: "syne", repoFile: "Syne[wght].ttf" },
  { slug: "playfair-display", repoSlug: "playfairdisplay", repoFile: "PlayfairDisplay[wght].ttf" },
  { slug: "bebas-neue", repoSlug: "bebasneue", repoFile: "BebasNeue-Regular.ttf" },
  { slug: "poppins", repoSlug: "poppins", repoFile: "Poppins-Regular.ttf" },
  { slug: "montserrat", repoSlug: "montserrat", repoFile: "Montserrat[wght].ttf" },
  { slug: "abril-fatface", repoSlug: "abrilfatface", repoFile: "AbrilFatface-Regular.ttf" },
  { slug: "bungee", repoSlug: "bungee", repoFile: "Bungee-Regular.ttf" },
  { slug: "monoton", repoSlug: "monoton", repoFile: "Monoton-Regular.ttf" },
  { slug: "alfa-slab-one", repoSlug: "alfaslabone", repoFile: "AlfaSlabOne-Regular.ttf" },
  { slug: "staatliches", repoSlug: "staatliches", repoFile: "Staatliches-Regular.ttf" },
  { slug: "dm-serif-display", repoSlug: "dmserifdisplay", repoFile: "DMSerifDisplay-Regular.ttf" },
  { slug: "sora", repoSlug: "sora", repoFile: "Sora[wght].ttf" },
  { slug: "zilla-slab", repoSlug: "zillaslab", repoFile: "ZillaSlab-Regular.ttf" },
  // 나눔손글씨 붓/펜 — 한글 손글씨체(Naver/NHN, OFL). opentype.js로
  // "Hello"/"안녕하세요"/"가나다라" 등 라틴+한글 다문자 문자열을
  // 실제 파싱 검증했고(GSUB lookupType 6 문제 없음, bbox 정상),
  // 완성형 한글 음절 커버리지 때문에 원본 TTF가 3MB대로 다른
  // 폰트보다 훨씬 크다 — opentype.js 파싱용 원본이라 사용자에게
  // 직접 전송되지는 않는다(전송되는 건 fetch-fonts.mjs가 받는
  // latin 서브셋 WOFF2뿐, 한글 프리뷰 라벨링용이 아니라 폰트 피커
  // 버튼의 영문 패밀리명 표시용).
  { slug: "nanum-brush-script", repoSlug: "nanumbrushscript", repoFile: "NanumBrushScript-Regular.ttf" },
  { slug: "nanum-pen-script", repoSlug: "nanumpenscript", repoFile: "NanumPenScript-Regular.ttf" },
  // 나눔고딕/나눔명조/나눔고딕코딩 — 손글씨체가 아닌 일반 본문/제목용
  // 나눔 폰트. 같은 방식으로 "Hello"/"안녕하세요"/"가나다라" 실제
  // 파싱 검증 완료(GSUB 문제 없음, bbox 정상).
  { slug: "nanum-gothic", repoSlug: "nanumgothic", repoFile: "NanumGothic-Regular.ttf" },
  { slug: "nanum-myeongjo", repoSlug: "nanummyeongjo", repoFile: "NanumMyeongjo-Regular.ttf" },
  { slug: "nanum-gothic-coding", repoSlug: "nanumgothiccoding", repoFile: "NanumGothicCoding-Regular.ttf" },
  // "나눔" 브랜딩 폰트는 google/fonts 전체에 5개뿐이다(git tree로
  // 직접 확인) — 라틴 폰트 카탈로그(20개)와 개수를 맞추려고 나머지
  // 15개는 "나눔"이 아닌 다른 한글 지원 구글 폰트로 채웠다. 전부
  // METADATA.pb에 subsets: "korean" 있는 것 확인 + opentype.js로
  // "Hello"/"안녕하세요"/"가나다라" 실제 파싱 검증 완료. 무작위가
  // 아니라 라틴 카탈로그와 같은 카테고리 다양성 기준으로 골랐다:
  // 실용 UI 산세리프 3, 세리프 3, 굵은 디스플레이 3, 모던 산세리프
  // 2, 손글씨/스크립트 4.
  //
  // Noto Sans/Serif KR은 유의미하게 무겁다(각각 10.4MB/23.8MB —
  // 다른 폰트들의 2-8MB대와 자릿수가 다르다) — 판(pan-CJK) 커버리지
  // 때문. opentype.js 파싱용 원본이라 폰트 선택 시에만 지연
  // 로드되지만(초기 번들 무관), 이 둘을 고를 때만 유독 체감되는
  // 로딩 시간이 있을 수 있다는 걸 명시해둔다 — 그래도 넣은 이유는
  // 구글 자체 표준 한글 폰트로 실사용 빈도가 가장 높은 축에
  // 속해서, "범용적으로 쓰이는" 기준에 가장 부합하기 때문이다.
  { slug: "noto-sans-kr", repoSlug: "notosanskr", repoFile: "NotoSansKR[wght].ttf" },
  { slug: "noto-serif-kr", repoSlug: "notoserifkr", repoFile: "NotoSerifKR[wght].ttf" },
  { slug: "gothic-a1", repoSlug: "gothica1", repoFile: "GothicA1-Regular.ttf" },
  { slug: "ibm-plex-sans-kr", repoSlug: "ibmplexsanskr", repoFile: "IBMPlexSansKR-Regular.ttf" },
  { slug: "gowun-batang", repoSlug: "gowunbatang", repoFile: "GowunBatang-Regular.ttf" },
  { slug: "hahmlet", repoSlug: "hahmlet", repoFile: "Hahmlet[wght].ttf" },
  { slug: "black-han-sans", repoSlug: "blackhansans", repoFile: "BlackHanSans-Regular.ttf" },
  { slug: "do-hyeon", repoSlug: "dohyeon", repoFile: "DoHyeon-Regular.ttf" },
  { slug: "jua", repoSlug: "jua", repoFile: "Jua-Regular.ttf" },
  { slug: "gowun-dodum", repoSlug: "gowundodum", repoFile: "GowunDodum-Regular.ttf" },
  { slug: "stylish", repoSlug: "stylish", repoFile: "Stylish-Regular.ttf" },
  { slug: "gaegu", repoSlug: "gaegu", repoFile: "Gaegu-Regular.ttf" },
  { slug: "poor-story", repoSlug: "poorstory", repoFile: "PoorStory-Regular.ttf" },
  { slug: "east-sea-dokdo", repoSlug: "eastseadokdo", repoFile: "EastSeaDokdo-Regular.ttf" },
  { slug: "song-myung", repoSlug: "songmyung", repoFile: "SongMyung-Regular.ttf" },
];

async function downloadFile(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`TTF 다운로드 실패 (${url}): ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  return buf.length;
}

async function main() {
  for (const { slug, repoSlug, repoFile } of KINETIC_FONT_MANIFEST) {
    const familyDir = path.join(FONTS_DIR, slug);
    await mkdir(familyDir, { recursive: true });

    const url = `https://raw.githubusercontent.com/google/fonts/main/ofl/${repoSlug}/${encodeURIComponent(repoFile)}`;
    const destPath = path.join(familyDir, "source.ttf");
    const bytes = await downloadFile(url, destPath);
    console.log(`${slug}: ${path.relative(process.cwd(), destPath)} (${bytes} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
