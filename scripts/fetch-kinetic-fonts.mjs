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
const KINETIC_FONT_MANIFEST = [
  { slug: "space-grotesk", repoSlug: "spacegrotesk", repoFile: "SpaceGrotesk[wght].ttf" },
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
