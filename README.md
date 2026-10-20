# Typography Playground

**한국어** · [English](README.en.md)

정적 사이트 하나에 담은 작은 타이포그래피 도구 두 개입니다. 어디에나 붙여 넣을 수 있는 유니코드 텍스트 꾸미기 도구와, 움직이는 글자를 그려 PNG나 GIF로 내보내는 키네틱 타이포그래피 캔버스입니다.

**서비스 주소:** https://typography-playground.seungwoo7050.workers.dev

## 하는 일

| 페이지                               | 하는 일                                                                                                                                                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **유니코드 생성기** (`/`)            | 라틴 문자를 입력하면 18가지 유니코드 스타일(Bold, Italic, Script, Gothic, Double-Struck, Bubble, Square, Fullwidth, Small Caps, 위첨자/아래첨자, 취소선, 밑줄, Zalgo)로 바꿔 보여 줍니다. 카드를 누르면 바로 복사됩니다. 일반 텍스트라서 SNS 소개란이나 채팅에 그대로 붙습니다 |
| **키네틱 타이포그래피** (`/kinetic`) | 단어를 입력하고 폰트 41종(라틴·한글) 중 하나와 효과(Gradient Fill, Outline Stroke, Glitch, Liquid Wave)를 골라 파라미터를 조절한 뒤, PNG 정지 이미지나 움직이는 GIF로 내보냅니다                                                                                               |

- **백엔드, 계정, 추적이 없습니다.** 모든 처리는 브라우저에서 합니다.
- **폰트는 직접 호스팅합니다.** Google Fonts 카탈로그(SIL OFL)에서 받았고, 폰트마다 라이선스 파일이 `public/fonts/`에 함께 있습니다.
- 글자는 폰트 윤곽선(opentype.js)으로 그립니다. Liquid Wave는 WebGL로 렌더링하고, GIF 인코딩은 Web Worker에서 돌려 화면이 멈추지 않습니다.
- 동작 줄이기 설정을 따릅니다(마그네틱·패럴랙스 효과가 시스템 설정을 따라갑니다).

## 실행

Node `24.21.0`, npm `11.19.0`이 필요합니다(`.nvmrc`, `package.json`의 `engines`).

```bash
npm ci
npm run dev        # http://localhost:3100
```

| 명령                          | 하는 일                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| `npm run lint`                | ESLint                                                            |
| `npm run typecheck`           | TypeScript 타입 검사(파일을 만들지 않음)                          |
| `npm run test`                | 단위 테스트(Vitest)                                               |
| `npm run build`               | `out/`으로 정적 export                                            |
| `npm run preview`             | 빌드한 뒤 `out/`을 3100번 포트로 띄움                             |
| `npm run test:e2e:production` | 빌드한 뒤 띄운 `out/`을 대상으로 Playwright 실행(데스크톱·모바일) |

CI는 모든 pull request와 `main` push에서 린트 → 타입 검사 → 단위 테스트 → 빌드 → e2e를 돌리고, 모두 통과하면 `main`을 Cloudflare에 배포합니다.

## 배포

호스팅은 Cloudflare Workers 정적 자산입니다(`wrangler.toml`, `[assets] directory = "./out"`). Worker 스크립트 없이 빌드한 파일만 올립니다.

```bash
npm run build
npx --yes wrangler@4.146.0 deploy
```

CI에서는 같은 명령을 저장소 secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`로 실행합니다.

## 구성

- **Next.js 16** 정적 export(`output: "export"`, `images.unoptimized`), **React 19**, **Tailwind CSS 4**.
- **유니코드 스타일은 데이터입니다**: `src/features/unicode-generator/data/styles/`의 스타일마다 문자를 유니코드 코드 포인트로 대응시키고, registry가 같은 입력으로 모든 스타일을 만듭니다.
- **키네틱 엔진**: 효과마다 타입이 붙은 파라미터 스키마를 등록하고(`src/features/kinetic-engine/effects/`), 조절 패널은 그 스키마로 만들어집니다.

```
src/app/                         페이지(/, /kinetic)와 레이아웃
src/features/unicode-generator/  스타일 데이터, 변환, 카드
src/features/kinetic-engine/     폰트 로딩, 글리프 윤곽선, 효과, PNG/GIF 내보내기
public/fonts/                    직접 호스팅하는 폰트와 라이선스
scripts/                         폰트 내려받기 스크립트(fetch-fonts, fetch-kinetic-fonts)
tests/e2e/                       Playwright 테스트
```
