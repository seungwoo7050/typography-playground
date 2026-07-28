import type { AnyEffectDefinition, EffectGLState } from "../effects/types";
import type { GlyphOutline } from "./glyph-outline";

/**
 * requestAnimationFrame/cancelAnimationFrame/performance.now를 주입
 * 가능하게 만든 스케줄러 인터페이스. jsdom은 rAF를 구현하지 않으므로
 * 테스트에서는 가짜 스케줄러를 주입해 실제 브라우저 없이 프레임
 * 진행을 검증한다(§워커 트랜스포트 주입과 같은 원칙).
 */
export interface RenderLoopScheduler {
  requestFrame: (cb: (time: number) => void) => number;
  cancelFrame: (handle: number) => void;
  now: () => number;
}

const browserScheduler: RenderLoopScheduler = {
  requestFrame: (cb) => requestAnimationFrame(cb),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
  now: () => performance.now(),
};

/**
 * 단일 rAF 루프와 현재 씬 상태(이펙트/아웃라인/파라미터)를 소유한다.
 * renderTarget에 따라 Canvas2D 또는 WebGL2로 디스패치한다. 한 번에
 * 하나의 이펙트만 렌더링한다(다중 이펙트 합성은 MVP 비목표 —
 * §계획서 "MVP 비목표" 참고).
 */
export class RenderLoop {
  private readonly scheduler: RenderLoopScheduler;
  private frameHandle: number | null = null;
  private startTime: number | null = null;

  private ctx2d: CanvasRenderingContext2D | null = null;
  private gl: WebGL2RenderingContext | null = null;

  private effect: AnyEffectDefinition | null = null;
  private outline: GlyphOutline | null = null;
  private params: Record<string, unknown> = {};
  private glState: EffectGLState | null = null;

  constructor(scheduler: RenderLoopScheduler = browserScheduler) {
    this.scheduler = scheduler;
  }

  /** canvas2d/webgl 이펙트를 실시간으로 오가려면 두 종류의 캔버스
   * 엘리먼트를 각각 붙여둬야 한다(하나의 캔버스는 컨텍스트 타입을
   * 한 번 정하면 바꿀 수 없다) — 그래서 서로를 null로 지우지 않고
   * 둘 다 유지한다. renderFrame이 effect.renderTarget으로 어느
   * 쪽을 쓸지 고른다. */
  attachCanvas2D(ctx: CanvasRenderingContext2D): void {
    this.ctx2d = ctx;
  }

  attachWebGL(gl: WebGL2RenderingContext): void {
    this.gl = gl;
  }

  /** 렌더링할 씬(이펙트+아웃라인+파라미터)을 교체한다. 이펙트나
   * 아웃라인이 실제로 바뀔 때만 WebGL 리소스를 다시 만든다 — 파라미터
   * 슬라이더만 움직일 때마다 삼각분할/GPU 버퍼를 재생성하는 낭비를
   * 막는다(파라미터는 매 프레임 유니폼으로만 전달됨). */
  setScene(
    effect: AnyEffectDefinition,
    outline: GlyphOutline,
    params: Record<string, unknown> = effect.defaultParams,
  ): void {
    const sceneShapeUnchanged = this.effect === effect && this.outline === outline;
    this.effect = effect;
    this.outline = outline;
    this.params = params;

    if (!sceneShapeUnchanged) {
      this.glState = null;
      if (effect.renderTarget === "webgl" && this.gl && effect.initGL) {
        this.glState = effect.initGL(this.gl, outline, params);
      }
    }
  }

  start(): void {
    if (this.frameHandle !== null) return; // 이미 실행 중이면 중복 시작 방지
    this.startTime = this.scheduler.now();
    const tick = (time: number) => {
      this.renderFrame(time);
      this.frameHandle = this.scheduler.requestFrame(tick);
    };
    this.frameHandle = this.scheduler.requestFrame(tick);
  }

  stop(): void {
    if (this.frameHandle !== null) {
      this.scheduler.cancelFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }

  get isRunning(): boolean {
    return this.frameHandle !== null;
  }

  private renderFrame(time: number): void {
    if (!this.effect || !this.outline || this.startTime === null) return;
    const t = (time - this.startTime) / 1000;

    if (this.effect.renderTarget === "canvas2d" && this.ctx2d) {
      this.effect.drawFrame?.(this.ctx2d, this.outline, this.params, t);
    } else if (this.effect.renderTarget === "webgl" && this.gl && this.glState) {
      this.effect.renderGL?.(this.gl, this.glState, this.params, t);
    }
  }
}
