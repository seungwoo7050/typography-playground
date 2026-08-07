// SIL OFL 폰트를 Google Fonts에서 self-host용으로 내려받는 스크립트.
//
// 왜 self-host인가: Google Fonts CDN을 직접 참조하면 서드파티 요청/동의
// 표면이 생긴다(프라이버시 마케팅 훅과 상충). Google Fonts 카탈로그는
// OFL/Apache2 라이선스만 등재를 허용하므로 라이선스가 검증된 안전한
// 소스로 사용한다.
//
// 왜 latin 서브셋만 받는가: 유니코드 생성기(Tier 1)의 유사 글리프 기법
// 자체가 Latin 문자에만 적용 가능한 구조적 한계가 있어(§CLAUDE.md 계획
// 참고), 다른 스크립트 서브셋(cyrillic, greek, vietnamese 등)을 받을
// 이유가 없다.
//
// 재실행 가능: 폰트 목록/굵기를 바꾸면 이 스크립트를 다시 돌려 산출물을
// 갱신한다 — 수동으로 브라우저에서 내려받은 파일이 아니라 재현 가능한
// 과정으로 남긴다.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "..", "public", "fonts");

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/** @type {{ family: string, slug: string, repoSlug: string, weights: number[] }[]} */
const FONT_MANIFEST = [
  { family: "Inter", slug: "inter", repoSlug: "inter", weights: [400, 500, 600, 700] },
  { family: "Space Grotesk", slug: "space-grotesk", repoSlug: "spacegrotesk", weights: [400, 700] },
  // Bricolage Grotesque: 키네틱 엔진 카탈로그에서 제외됨(§font-loader.ts
  // 주석 참고 — opentype.js가 GSUB lookupType 6 substFormat 2를
  // 지원하지 않아 두 글자 이상 텍스트에서 무조건 실패). 사이트
  // 어디서도 쓰지 않아 여기서도 제거.
  { family: "Fraunces", slug: "fraunces", repoSlug: "fraunces", weights: [400, 700] },
  { family: "Unbounded", slug: "unbounded", repoSlug: "unbounded", weights: [400, 700] },
  { family: "Archivo Black", slug: "archivo-black", repoSlug: "archivoblack", weights: [400] },
  { family: "Big Shoulders", slug: "big-shoulders", repoSlug: "bigshoulders", weights: [400, 700] },
  { family: "Anton", slug: "anton", repoSlug: "anton", weights: [400] },
  { family: "Righteous", slug: "righteous", repoSlug: "righteous", weights: [400] },
  { family: "Syne", slug: "syne", repoSlug: "syne", weights: [400, 700] },
  { family: "Playfair Display", slug: "playfair-display", repoSlug: "playfairdisplay", weights: [400] },
  { family: "Bebas Neue", slug: "bebas-neue", repoSlug: "bebasneue", weights: [400] },
  { family: "Poppins", slug: "poppins", repoSlug: "poppins", weights: [400] },
  { family: "Montserrat", slug: "montserrat", repoSlug: "montserrat", weights: [400] },
  { family: "Abril Fatface", slug: "abril-fatface", repoSlug: "abrilfatface", weights: [400] },
  { family: "Bungee", slug: "bungee", repoSlug: "bungee", weights: [400] },
  { family: "Monoton", slug: "monoton", repoSlug: "monoton", weights: [400] },
  { family: "Alfa Slab One", slug: "alfa-slab-one", repoSlug: "alfaslabone", weights: [400] },
  { family: "Staatliches", slug: "staatliches", repoSlug: "staatliches", weights: [400] },
  // Space Mono, Instrument Serif, Chivo: Bricolage Grotesque와 같은 이유로
  // 키네틱 엔진 카탈로그에서 제외됨 — 여기서도 제거.
  { family: "DM Serif Display", slug: "dm-serif-display", repoSlug: "dmserifdisplay", weights: [400] },
  { family: "Sora", slug: "sora", repoSlug: "sora", weights: [400] },
  { family: "Zilla Slab", slug: "zilla-slab", repoSlug: "zillaslab", weights: [400] },
  // 나눔손글씨 붓/펜: 이 latin 서브셋 WOFF2는 opentype.js 렌더링용이
  // 아니라(그건 fetch-kinetic-fonts.mjs가 원본 TTF로 따로 받는다)
  // FontPicker 버튼이 자기 폰트로 라벨을 미리보기할 때만 쓴다 —
  // 라벨 자체가 영문 패밀리명이라 latin 서브셋으로 충분하다. Google
  // CSS2 응답을 직접 확인해보니 이 두 폰트는 한글 음절 범위를
  // 수십 개 unicode-range 블록으로 잘게 쪼개 보내지만(무주석),
  // 실제 라틴 커버리지(U+0000-00FF)를 담은 블록에는 다른 폰트와
  // 동일하게 "/* latin */" 주석이 정확히 붙어 있어 기존
  // extractLatinWoff2Urls 로직을 그대로 재사용해도 된다(검증 완료).
  { family: "Nanum Brush Script", slug: "nanum-brush-script", repoSlug: "nanumbrushscript", weights: [400] },
  { family: "Nanum Pen Script", slug: "nanum-pen-script", repoSlug: "nanumpenscript", weights: [400] },
];

async function fetchCss(family, weights) {
  const familyParam = encodeURIComponent(family).replace(/%20/g, "+");
  const wghtParam = weights.join(";");
  const url = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${wghtParam}&display=swap`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Google Fonts CSS 요청 실패 (${family}): ${res.status}`);
  }
  return res.text();
}

/** latin 서브셋 @font-face 블록만 추출해 { weight -> woff2 URL } 맵으로 변환 */
function extractLatinWoff2Urls(css) {
  /** @type {Map<number, string>} */
  const result = new Map();
  const blockRe = /\/\* latin \*\/\s*@font-face\s*{[^}]*font-weight:\s*(\d+);[^}]*url\(([^)]+\.woff2)\)/g;
  let match;
  while ((match = blockRe.exec(css)) !== null) {
    const weight = Number(match[1]);
    const url = match[2];
    result.set(weight, url);
  }
  return result;
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`폰트 파일 다운로드 실패 (${url}): ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
}

async function fetchLicense(repoSlug, family) {
  const url = `https://raw.githubusercontent.com/google/fonts/main/ofl/${repoSlug}/OFL.txt`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`OFL 라이선스 다운로드 실패 (${family}, ${repoSlug}): ${res.status}`);
  }
  return res.text();
}

async function main() {
  await mkdir(FONTS_DIR, { recursive: true });

  for (const entry of FONT_MANIFEST) {
    const { family, slug, repoSlug, weights } = entry;
    console.log(`\n[${family}]`);

    const css = await fetchCss(family, weights);
    const urls = extractLatinWoff2Urls(css);
    if (urls.size === 0) {
      throw new Error(`${family}: latin 서브셋 woff2 URL을 찾지 못함 — CSS 응답 형식이 바뀌었을 수 있음`);
    }

    const familyDir = path.join(FONTS_DIR, slug);
    await mkdir(familyDir, { recursive: true });

    for (const weight of weights) {
      const url = urls.get(weight);
      if (!url) {
        throw new Error(`${family}: weight ${weight}에 대한 woff2 URL을 찾지 못함`);
      }
      const destPath = path.join(familyDir, `${weight}.woff2`);
      await downloadFile(url, destPath);
      console.log(`  ${weight} -> ${path.relative(process.cwd(), destPath)}`);
    }

    const license = await fetchLicense(repoSlug, family);
    const licensePath = path.join(FONTS_DIR, `LICENSE-${slug}.txt`);
    await writeFile(licensePath, license);
    console.log(`  license -> ${path.relative(process.cwd(), licensePath)}`);
  }

  console.log("\n모든 폰트 다운로드 완료.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
