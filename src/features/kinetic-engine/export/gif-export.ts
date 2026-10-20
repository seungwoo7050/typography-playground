import type { Font } from "opentype.js";
import { centerOutline, extractGlyphOutline } from "../core/glyph-outline";
import { releaseWebGLContext } from "../core/webgl-utils";
import type { AnyEffectDefinition, EffectGLState } from "../effects/types";
import { computeExportFontSize } from "./png-export";
import type { GifEncodeRequest, GifEncodeResponse } from "./worker/gif-encode.worker";

// GIF는 프레임 수 × 해상도에 비례해 인코딩 비용이 커진다 — PNG처럼
// 여러 해상도를 고르게 하는 대신 라이브 프리뷰와 같은 캔버스
// 해상도(800×280) 하나로 스코프를 좁혔다. 다중 해상도가 필요해지면
// PNG_EXPORT_SIZES처럼 확장하되, 그때는 프레임 수/시간을 해상도별로
// 다시 예산화해야 한다(지금은 그 판단을 미룸 — 성급한 확장 아님).
export const GIF_EXPORT_WIDTH = 800;
export const GIF_EXPORT_HEIGHT = 280;
const GIF_DURATION_MS = 2000;
const GIF_FPS = 15;
const GIF_ENCODE_TIMEOUT_MS = 30_000;

/** 지정한 길이/fps로 총 프레임 수를 계산한다 — DOM과 분리된 순수
 * 함수라 유닛 테스트 가능하다. */
export function computeGifFrameCount(durationMs: number, fps: number): number {
  return Math.round((durationMs / 1000) * fps);
}

/** 프레임 하나당 표시 시간(ms)을 계산한다. */
export function computeGifFrameDelayMs(fps: number): number {
  return 1000 / fps;
}

export type GifExportPhase = "preparing" | "rendering" | "encoding" | "done";

/**
 * 매 프레임을 오프스크린 소스 캔버스(canvas2d 또는 webgl2, 이펙트의
 * renderTarget에 따라)에 그린 뒤, 별도의 2D 캡처 캔버스에
 * drawImage해서 픽셀을 뽑는다. gl.readPixels() 대신 이 방식을 쓰는
 * 이유: WebGL의 드로잉 버퍼는 아래-위가 뒤집힌 순서라 readPixels로
 * 직접 읽으면 수동으로 뒤집어야 한다 — Canvas.tsx의 크로스페이드
 * 스냅샷이 이미 canvas.toDataURL()로 이 문제를 겪지 않고 있는 것과
 * 같은 이유로, drawImage(sourceCanvas)가 두 렌더 타겟 모두에서
 * 방향이 맞는 픽셀을 돌려준다는 걸 재사용한다.
 */
async function captureFrames(
  effect: AnyEffectDefinition,
  outline: ReturnType<typeof centerOutline>,
  params: Record<string, unknown>,
  width: number,
  height: number,
  frameCount: number,
  fps: number,
): Promise<ArrayBuffer[]> {
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = width;
  sourceCanvas.height = height;

  const captureCanvas = document.createElement("canvas");
  captureCanvas.width = width;
  captureCanvas.height = height;
  const captureCtx = captureCanvas.getContext("2d");
  if (!captureCtx) throw new Error("2D 캡처 컨텍스트 생성 실패 — GIF export 불가");

  const frames: ArrayBuffer[] = [];

  if (effect.renderTarget === "canvas2d") {
    const ctx = sourceCanvas.getContext("2d");
    if (!ctx) throw new Error("2D 컨텍스트 생성 실패 — GIF export 불가");
    for (let i = 0; i < frameCount; i++) {
      const t = i / fps;
      ctx.clearRect(0, 0, width, height);
      effect.drawFrame?.(ctx, outline, params, t);
      captureCtx.clearRect(0, 0, width, height);
      captureCtx.drawImage(sourceCanvas, 0, 0);
      const imageData = captureCtx.getImageData(0, 0, width, height);
      frames.push(imageData.data.buffer);
      await yieldToMainThread();
    }
  } else {
    // 프레임 사이에 메인 스레드를 내주므로(yieldToMainThread) 그 틈에
    // 브라우저가 컴포지트하며 버퍼를 비울 수 있다 — 매 프레임 다시
    // 캡처(drawImage)하더라도 명시적으로 켜둔다. Canvas.tsx의 라이브
    // 크로스페이드 스냅샷이 preserveDrawingBuffer를 켜는 것과 같은
    // 이유다.
    const gl = sourceCanvas.getContext("webgl2", { preserveDrawingBuffer: true });
    if (!gl) throw new Error("WebGL2 컨텍스트 생성 실패 — GIF export 불가");
    let glState: EffectGLState | undefined;
    try {
      glState = effect.initGL?.(gl, outline, params);
      for (let i = 0; i < frameCount; i++) {
        const t = i / fps;
        if (glState) effect.renderGL?.(gl, glState, params, t);
        captureCtx.clearRect(0, 0, width, height);
        captureCtx.drawImage(sourceCanvas, 0, 0);
        const imageData = captureCtx.getImageData(0, 0, width, height);
        frames.push(imageData.data.buffer);
        await yieldToMainThread();
      }
    } finally {
      // 프레임을 다 복사했거나 중간에 던졌거나 export 전용 컨텍스트와
      // 리소스를 바로 놓아준다 — initGL·renderGL 예외에도 남지 않게.
      if (glState) effect.disposeGL?.(gl, glState);
      releaseWebGLContext(gl);
    }
  }

  return frames;
}

/** 프레임 사이에 메인 스레드를 한 번 내준다 — 캡처 루프가 동기로
 * 30프레임을 내리 그리면 그동안 라이브 캔버스의 rAF와 입력 처리가 멈춘다.
 * setTimeout은 탭이 백그라운드여도 진행하므로(rAF는 멈춘다) 내보내기가
 * 탭 전환 때문에 멎지 않는다. */
function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function encodeGifInWorker(request: GifEncodeRequest): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./worker/gif-encode.worker.ts", import.meta.url),
    );
    // 워커가 응답 없이 멈추면 내보내기 버튼이 영원히 "인코딩 중"에
    // 묶인다 — 시간을 넘기면 워커를 끝내고 실패로 돌린다.
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error("GIF 인코딩 시간 초과"));
    }, GIF_ENCODE_TIMEOUT_MS);
    worker.onmessage = (event: MessageEvent<GifEncodeResponse>) => {
      clearTimeout(timer);
      worker.terminate();
      if (event.data.ok) {
        resolve(new Blob([event.data.bytes], { type: "image/gif" }));
      } else {
        reject(new Error(event.data.error));
      }
    };
    worker.onerror = (event) => {
      clearTimeout(timer);
      worker.terminate();
      reject(new Error(event.message));
    };
    worker.postMessage(request, request.frames);
  });
}

/**
 * 현재 이펙트를 GIF_DURATION_MS 동안 GIF_FPS로 캡처해 애니메이션
 * GIF로 인코딩한다. 프레임 렌더링(캔버스/WebGL API가 필요해 메인
 * 스레드에서만 가능)은 프레임마다 메인 스레드를 내주는 루프로 처리하고,
 * 실제로 무거운 단계인 팔레트 양자화+LZW 인코딩만 Web Worker로 넘겨
 * 라이브 프리뷰가 끊기지 않게 한다.
 */
export async function exportGif(
  font: Font,
  text: string,
  effect: AnyEffectDefinition,
  params: Record<string, unknown>,
  onProgress?: (phase: GifExportPhase) => void,
): Promise<Blob> {
  onProgress?.("preparing");
  const width = GIF_EXPORT_WIDTH;
  const height = GIF_EXPORT_HEIGHT;
  const fontSize = computeExportFontSize(width);
  const raw = extractGlyphOutline(font, text, fontSize);
  const outline = centerOutline(raw, width, height);

  const frameCount = computeGifFrameCount(GIF_DURATION_MS, GIF_FPS);
  const delayMs = computeGifFrameDelayMs(GIF_FPS);

  onProgress?.("rendering");
  const frames = await captureFrames(effect, outline, params, width, height, frameCount, GIF_FPS);

  onProgress?.("encoding");
  const blob = await encodeGifInWorker({ frames, width, height, delayMs });
  onProgress?.("done");
  return blob;
}
