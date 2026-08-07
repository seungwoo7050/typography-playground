import { GIFEncoder, applyPalette, quantize } from "gifenc";

export interface GifEncodeRequest {
  /** 프레임당 RGBA Uint8ClampedArray의 ArrayBuffer — transferable로
   * 넘어와 구조적 복제 대신 소유권만 이전된다. */
  frames: ArrayBuffer[];
  width: number;
  height: number;
  /** 프레임당 표시 시간(ms) — GIF 스펙은 센티초 단위라 인코더가
   * 내부에서 변환한다. */
  delayMs: number;
  maxColors?: number;
}

export type GifEncodeResponse =
  | { ok: true; bytes: ArrayBuffer }
  | { ok: false; error: string };

// 이 tsconfig는 단일 프로젝트라 "webworker" lib을 별도로 두지 않는다
// (DOM lib과 webworker lib을 동시에 켤 수 없음 — self/postMessage
// 타입이 서로 다르다). self를 실제로 쓰는 모양대로 직접 타입 지정해
// 우회한다 — 런타임에는 이 파일이 워커로 번들되므로 self가 진짜
// DedicatedWorkerGlobalScope다.
const ctx = self as unknown as {
  postMessage(message: GifEncodeResponse, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent<GifEncodeRequest>) => void) | null;
};

ctx.onmessage = (event) => {
  const { frames, width, height, delayMs, maxColors = 256 } = event.data;
  try {
    const encoder = GIFEncoder();
    for (const frameBuffer of frames) {
      const rgba = new Uint8ClampedArray(frameBuffer);
      // 이펙트가 프레임마다 색이 실제로 바뀌는 애니메이션(예:
      // gradient-fill의 hue 회전)이라 프레임마다 새로 quantize한다
      // — 전역 팔레트 하나를 공유하면 시간에 따라 바뀌는 색이
      // 부정확하게 근사된다. GIF는 프레임별 로컬 컬러 테이블을
      // 공식적으로 지원하므로 이게 특이 케이스가 아니다.
      //
      // format을 명시하지 않으면 quantize/applyPalette 기본값인
      // 'rgb565'가 알파를 완전히 무시한다 — 캔버스가 투명하게 비워둔
      // 배경(alpha=0)이 RGB(0,0,0)만 보고 검은 배경으로 구워졌다(PNG
      // export와 비교해 실제로 발견한 차이). 'rgba4444' +
      // oneBitAlpha로 GIF가 지원하는 이진 투명도(정확한 알파 블렌딩은
      // 아니지만 완전 불투명 vs 완전 투명은 구분)를 살린다.
      const palette = quantize(rgba, maxColors, {
        format: "rgba4444",
        oneBitAlpha: true,
      });
      const indexed = applyPalette(rgba, palette, "rgba4444");
      const transparentIndex = palette.findIndex(([, , , a]) => a === 0);
      encoder.writeFrame(indexed, width, height, {
        palette,
        delay: delayMs,
        repeat: 0,
        transparent: transparentIndex !== -1,
        transparentIndex: transparentIndex === -1 ? 0 : transparentIndex,
      });
    }
    encoder.finish();
    const bytes = encoder.bytes();
    // Uint8Array.buffer는 TS 타입상 ArrayBufferLike(SharedArrayBuffer
    // 포함)지만, gifenc의 내부 버퍼는 항상 `new Uint8Array(n)`으로
    // 만들어져 실제로는 평범한 ArrayBuffer뿐이다.
    const arrayBuffer = bytes.buffer as ArrayBuffer;
    ctx.postMessage({ ok: true, bytes: arrayBuffer }, [arrayBuffer]);
  } catch (err) {
    ctx.postMessage({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
