// gifenc(1.0.3)는 타입 선언을 제공하지 않고 @types/gifenc도 존재하지
// 않는다 — node_modules/gifenc/dist/gifenc.esm.js의 실제 export문과
// 함수 시그니처(구조분해되는 옵션 필드까지)를 직접 읽어 옮긴 선언이다.
declare module "gifenc" {
  export interface GifWriteFrameOptions {
    transparent?: boolean;
    transparentIndex?: number;
    /** 밀리초 단위 — 인코더 내부에서 센티초로 변환한다. */
    delay?: number;
    /** 첫 프레임은 필수(없으면 인코더가 예외를 던진다), 이후 프레임은
     * 생략하면 전역 팔레트를 재사용하고, 넘기면 그 프레임만의 로컬
     * 컬러 테이블을 쓴다. */
    palette?: number[][] | null;
    /** 0이면 무한 반복(NETSCAPE2.0 루프 익스텐션) — 첫 프레임에서만
     * 실제로 기록된다. */
    repeat?: number;
    colorDepth?: number;
    dispose?: number;
  }

  export interface GifEncoderInstance {
    reset(): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    readonly buffer: ArrayBuffer;
    writeFrame(
      indexedPixels: Uint8Array,
      width: number,
      height: number,
      options?: GifWriteFrameOptions,
    ): void;
  }

  export function GIFEncoder(opts?: {
    initialCapacity?: number;
    auto?: boolean;
  }): GifEncoderInstance;

  export type GifPixelFormat = "rgb565" | "rgba4444" | "rgb444";

  export interface QuantizeOptions {
    format?: GifPixelFormat;
    clearAlpha?: boolean;
    clearAlphaColor?: number;
    clearAlphaThreshold?: number;
    oneBitAlpha?: boolean | number;
    useSqrt?: boolean;
  }

  /** RGBA 픽셀 버퍼에서 최대 maxColors개의 팔레트를 뽑는다. */
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions,
  ): number[][];

  /** RGBA 픽셀 버퍼를 팔레트 인덱스(픽셀당 1바이트)로 변환한다 —
   * writeFrame의 첫 인자가 이 결과다. */
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: GifPixelFormat,
  ): Uint8Array;
}
