import type { Font } from "opentype.js";
import { centerOutline, extractGlyphOutline } from "../core/glyph-outline";
import { releaseWebGLContext } from "../core/webgl-utils";
import type { AnyEffectDefinition } from "../effects/types";

export interface PngExportSize {
  id: string;
  label: string;
  width: number;
  height: number;
}

// 온스크린 캔버스(800×280, fontSize 120)를 기준으로, export 크기가
// 커질수록 글자도 비례해서 커지게 한다 — 안 그러면 1920×1080으로
// 내보냈을 때 글자가 화면 가운데 작게 찍힌 것처럼 보인다.
const REFERENCE_CANVAS_WIDTH = 800;
const REFERENCE_FONT_SIZE = 120;

export const PNG_EXPORT_SIZES: PngExportSize[] = [
  { id: "canvas", label: "캔버스 크기 (800×280)", width: 800, height: 280 },
  { id: "square", label: "정사각형 (1080×1080)", width: 1080, height: 1080 },
  { id: "social", label: "소셜 배너 (1200×630)", width: 1200, height: 630 },
  { id: "wide", label: "와이드 (1920×1080)", width: 1920, height: 1080 },
];

/** REFERENCE_CANVAS_WIDTH 대비 export 폭 비율만큼 폰트 크기를 키운다
 * — DOM/캔버스와 분리된 순수 함수라 유닛 테스트 가능하다. */
export function computeExportFontSize(exportWidth: number): number {
  return REFERENCE_FONT_SIZE * (exportWidth / REFERENCE_CANVAS_WIDTH);
}

/**
 * PNG export가 실제로 거치는 단계. canvas.toBlob()은 브라우저가
 * 세부 인코딩 퍼센트를 노출하지 않는다 — 그래서 "37%..." 같은 가짜
 * 숫자를 지어내는 대신, 코드가 실제로 통과하는 체크포인트(준비 →
 * 렌더링 → 인코딩 → 완료)를 그대로 진행 신호로 쓴다. 작은 크기는
 * 이 단계들이 사실상 동시에 지나가 시각적으로 안 보일 수 있는데,
 * 그것도 정직한 결과다 — 실제로 그만큼 빠르다는 뜻이므로 억지로
 * 지연을 넣지 않는다.
 */
export type ExportPhase = "preparing" | "rendering" | "encoding" | "done";

/**
 * 지정한 해상도로 현재 이펙트를 다시 렌더링해 PNG Blob을 만든다.
 * 화면에 보이는 캔버스를 그대로 스케일하지 않고, 글리프 아웃라인
 * 추출부터 다시 한다 — opentype.js 벡터 아웃라인이 해상도 독립적이라
 * 이렇게 해야 큰 해상도로 내보내도 선명하다(래스터 확대가 아님).
 *
 * canvas2d 이펙트는 drawFrame을 한 프레임만 호출하고, webgl 이펙트는
 * 이 export 전용 캔버스에 새 WebGL2 컨텍스트를 만들어 initGL부터
 * 다시 실행한다(화면의 실시간 컨텍스트와 별개 — 서로 간섭하지 않음).
 */
export async function exportPng(
  font: Font,
  text: string,
  effect: AnyEffectDefinition,
  params: Record<string, unknown>,
  size: PngExportSize,
  onProgress?: (phase: ExportPhase) => void,
): Promise<Blob> {
  onProgress?.("preparing");
  const fontSize = computeExportFontSize(size.width);
  const raw = extractGlyphOutline(font, text, fontSize);
  const outline = centerOutline(raw, size.width, size.height);

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  onProgress?.("rendering");
  // export 전용 WebGL 컨텍스트와 리소스 — 인코딩이 끝나면 놓아준다.
  let releaseGL = () => {};
  try {
    if (effect.renderTarget === "canvas2d") {
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("2D 컨텍스트 생성 실패 — PNG export 불가");
      effect.drawFrame?.(ctx, outline, params, 0);
    } else {
      const gl = canvas.getContext("webgl2");
      if (!gl) throw new Error("WebGL2 컨텍스트 생성 실패 — PNG export 불가");
      // 컨텍스트를 얻은 직후부터 해제를 걸어 둔다 — initGL(셰이더
      // 컴파일·링크)이나 renderGL이 던져도 export 컨텍스트가 남지 않게.
      releaseGL = () => releaseWebGLContext(gl);
      const glState = effect.initGL?.(gl, outline, params);
      releaseGL = () => {
        if (glState) effect.disposeGL?.(gl, glState);
        releaseWebGLContext(gl);
      };
      if (glState) effect.renderGL?.(gl, glState, params, 0);
    }
  } catch (err) {
    releaseGL();
    throw err;
  }

  onProgress?.("encoding");
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      releaseGL();
      if (!blob) {
        reject(new Error("PNG 인코딩 실패"));
        return;
      }
      onProgress?.("done");
      resolve(blob);
    }, "image/png");
  });
}

/** 사용자가 입력한 텍스트를 파일명에 그대로 쓰면 "/"나 ":" 같은
 * 경로 구분 문자, 개행, 과도하게 긴 문자열이 섞여 다운로드가 깨질 수
 * 있다 — 영숫자/한글/공백/하이픈만 남기고 나머지는 언더스코어로
 * 치환, 앞뒤 공백 제거, 50자로 제한한다. */
export function sanitizeFilename(input: string): string {
  const cleaned = input
    .replace(/[^\p{L}\p{N} _-]/gu, "_")
    .trim()
    .slice(0, 50);
  return cleaned || "untitled";
}

/** Blob을 파일로 다운로드시킨다(앵커 클릭 트릭 — 모든 브라우저 호환). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
