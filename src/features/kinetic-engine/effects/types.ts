import type { GlyphOutline } from "../core/glyph-outline";

export type EffectRenderTarget = "canvas2d" | "webgl";

export type ParamFieldSchema =
  | { type: "number"; label: string; min: number; max: number; step: number }
  | { type: "color"; label: string }
  | { type: "boolean"; label: string };

export type ParamSchema<P> = { [K in keyof P]: ParamFieldSchema };

/** 이펙트별로 확장하는 WebGL 리소스 핸들(프로그램/버퍼/유니폼 위치 등). */
export type EffectGLState = Record<string, unknown>;

/**
 * 이펙트 확장 포인트. 새 이펙트를 추가하려면 이 인터페이스를 만족하는
 * 객체를 파일 하나에 정의하고 effects/index.ts에 한 줄 추가하면 된다
 * — 렌더 루프나 UI 쪽 코드는 건드릴 필요가 없다.
 *
 * renderTarget 규칙: 기본은 canvas2d. 픽셀 단위 셰이더 연산, 실제
 * 3D 변환/조명, 또는 canvas2d가 60fps로 못 버티는 규모의 프레임별
 * 지오메트리 재작성이 필요할 때만 webgl로 승급한다.
 */
export interface EffectDefinition<P = Record<string, unknown>> {
  id: string;
  label: string;
  renderTarget: EffectRenderTarget;
  defaultParams: P;
  paramSchema: ParamSchema<P>;
  /** 단일 프레임이 효과를 충실히 벡터로 표현할 수 있을 때만 true —
   * 셰이더/절차적 랜덤 이펙트는 정적 SVG로 의미 있게 표현할 방법이
   * 없으므로 거짓 export 버튼을 만들지 않는다. */
  supportsSvgExport: boolean;
  drawFrame?: (
    ctx: CanvasRenderingContext2D,
    outline: GlyphOutline,
    params: P,
    t: number,
  ) => void;
  initGL?: (
    gl: WebGL2RenderingContext,
    outline: GlyphOutline,
    params: P,
  ) => EffectGLState;
  renderGL?: (
    gl: WebGL2RenderingContext,
    state: EffectGLState,
    params: P,
    t: number,
  ) => void;
}

/**
 * 서로 다른 P를 가진 이펙트들을 한데 모으는 registry/index/render-loop
 * 경계에서 쓰는 타입 지움(type erasure) 별칭. drawFrame(params: P, ...)
 * 처럼 P가 함수 인자 위치(반공변)에 나타나 구조적 서브타이핑이
 * 안 되므로, 개별 이펙트 파일 안에서는 항상 구체 타입(예:
 * EffectDefinition<GradientFillParams>)을 쓰고, 이 경계에서만
 * AnyEffectDefinition으로 지운다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyEffectDefinition = EffectDefinition<any>;
