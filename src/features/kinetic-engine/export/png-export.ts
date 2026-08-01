import type { Font } from "opentype.js";
import { centerOutline, extractGlyphOutline } from "../core/glyph-outline";
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
): Promise<Blob> {
  const fontSize = computeExportFontSize(size.width);
  const raw = extractGlyphOutline(font, text, fontSize);
  const outline = centerOutline(raw, size.width, size.height);

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  if (effect.renderTarget === "canvas2d") {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D 컨텍스트 생성 실패 — PNG export 불가");
    effect.drawFrame?.(ctx, outline, params, 0);
  } else {
    const gl = canvas.getContext("webgl2");
    if (!gl) throw new Error("WebGL2 컨텍스트 생성 실패 — PNG export 불가");
    const glState = effect.initGL?.(gl, outline, params);
    if (glState) effect.renderGL?.(gl, glState, params, 0);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG 인코딩 실패"));
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
