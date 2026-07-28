import { describe, expect, it, vi } from "vitest";
import { RenderLoop, type RenderLoopScheduler } from "./render-loop";
import type { EffectDefinition } from "../effects/types";
import type { GlyphOutline } from "./glyph-outline";

function createFakeScheduler(): {
  scheduler: RenderLoopScheduler;
  tick: (time: number) => void;
  pendingCount: () => number;
} {
  let nextHandle = 1;
  const callbacks = new Map<number, (time: number) => void>();
  return {
    scheduler: {
      requestFrame: (cb) => {
        const handle = nextHandle++;
        callbacks.set(handle, cb);
        return handle;
      },
      cancelFrame: (handle) => {
        callbacks.delete(handle);
      },
      now: () => 0,
    },
    // 대기 중인 콜백을 지정 시각으로 한 번 실행한다(1프레임 진행).
    tick: (time: number) => {
      const pending = [...callbacks.entries()];
      callbacks.clear();
      for (const [, cb] of pending) cb(time);
    },
    pendingCount: () => callbacks.size,
  };
}

const outline: GlyphOutline = {
  commands: [],
  bbox: { x1: 0, y1: 0, x2: 0, y2: 0 },
  fontSize: 100,
};

function createCanvas2DEffect(
  drawFrame: EffectDefinition["drawFrame"],
): EffectDefinition {
  return {
    id: "test-canvas2d",
    label: "Test",
    renderTarget: "canvas2d",
    defaultParams: { intensity: 1 },
    paramSchema: {},
    supportsSvgExport: false,
    drawFrame,
  };
}

describe("RenderLoop", () => {
  it("start 전에는 실행 중이 아니다", () => {
    const { scheduler } = createFakeScheduler();
    const loop = new RenderLoop(scheduler);
    expect(loop.isRunning).toBe(false);
  });

  it("start하면 프레임을 예약하고 isRunning이 true가 된다", () => {
    const { scheduler, pendingCount } = createFakeScheduler();
    const loop = new RenderLoop(scheduler);
    loop.start();
    expect(loop.isRunning).toBe(true);
    expect(pendingCount()).toBe(1);
  });

  it("stop하면 예약이 취소되고 isRunning이 false가 된다", () => {
    const { scheduler, pendingCount } = createFakeScheduler();
    const loop = new RenderLoop(scheduler);
    loop.start();
    loop.stop();
    expect(loop.isRunning).toBe(false);
    expect(pendingCount()).toBe(0);
  });

  it("setScene한 canvas2d 이펙트의 drawFrame이 매 프레임 올바른 인자로 호출된다", () => {
    const { scheduler, tick } = createFakeScheduler();
    const drawFrame = vi.fn();
    const effect = createCanvas2DEffect(drawFrame);
    const loop = new RenderLoop(scheduler);
    const ctx = {} as CanvasRenderingContext2D;
    loop.attachCanvas2D(ctx);
    loop.setScene(effect, outline);
    loop.start();

    tick(500); // now(0) 기준 500ms 경과

    expect(drawFrame).toHaveBeenCalledTimes(1);
    expect(drawFrame).toHaveBeenCalledWith(
      ctx,
      outline,
      effect.defaultParams,
      0.5,
    );
  });

  it("파라미터를 명시하면 defaultParams 대신 그 값을 넘긴다", () => {
    const { scheduler, tick } = createFakeScheduler();
    const drawFrame = vi.fn();
    const effect = createCanvas2DEffect(drawFrame);
    const loop = new RenderLoop(scheduler);
    loop.attachCanvas2D({} as CanvasRenderingContext2D);
    loop.setScene(effect, outline, { intensity: 9 });
    loop.start();
    tick(100);

    expect(drawFrame).toHaveBeenCalledWith(
      expect.anything(),
      outline,
      { intensity: 9 },
      expect.any(Number),
    );
  });

  it("stop 이후에는 드로우가 더 이상 호출되지 않는다", () => {
    const { scheduler, tick } = createFakeScheduler();
    const drawFrame = vi.fn();
    const effect = createCanvas2DEffect(drawFrame);
    const loop = new RenderLoop(scheduler);
    loop.attachCanvas2D({} as CanvasRenderingContext2D);
    loop.setScene(effect, outline);
    loop.start();
    tick(100);
    loop.stop();
    tick(200);

    expect(drawFrame).toHaveBeenCalledTimes(1);
  });

  it("webgl 이펙트로 전환하면 initGL을 한 번 호출해 glState를 만든다", () => {
    const { scheduler } = createFakeScheduler();
    const initGL = vi.fn().mockReturnValue({ program: "fake" });
    const renderGL = vi.fn();
    const effect: EffectDefinition = {
      id: "test-webgl",
      label: "Test WebGL",
      renderTarget: "webgl",
      defaultParams: {},
      paramSchema: {},
      supportsSvgExport: false,
      initGL,
      renderGL,
    };
    const loop = new RenderLoop(scheduler);
    const gl = {} as WebGL2RenderingContext;
    loop.attachWebGL(gl);
    loop.setScene(effect, outline);

    expect(initGL).toHaveBeenCalledTimes(1);
    expect(initGL).toHaveBeenCalledWith(gl, outline, effect.defaultParams);
  });

  it("같은 이펙트/아웃라인에 파라미터만 바꿔 setScene하면 initGL을 다시 호출하지 않는다", () => {
    const { scheduler } = createFakeScheduler();
    const initGL = vi.fn().mockReturnValue({ program: "fake" });
    const effect: EffectDefinition = {
      id: "test-webgl-2",
      label: "Test WebGL 2",
      renderTarget: "webgl",
      defaultParams: { amplitude: 1 },
      paramSchema: {},
      supportsSvgExport: false,
      initGL,
      renderGL: vi.fn(),
    };
    const loop = new RenderLoop(scheduler);
    loop.attachWebGL({} as WebGL2RenderingContext);

    loop.setScene(effect, outline, { amplitude: 1 });
    loop.setScene(effect, outline, { amplitude: 9 }); // 파라미터만 변경

    expect(initGL).toHaveBeenCalledTimes(1);
  });

  it("아웃라인이 바뀌면(같은 이펙트라도) initGL을 다시 호출한다", () => {
    const { scheduler } = createFakeScheduler();
    const initGL = vi.fn().mockReturnValue({ program: "fake" });
    const effect: EffectDefinition = {
      id: "test-webgl-3",
      label: "Test WebGL 3",
      renderTarget: "webgl",
      defaultParams: {},
      paramSchema: {},
      supportsSvgExport: false,
      initGL,
      renderGL: vi.fn(),
    };
    const loop = new RenderLoop(scheduler);
    loop.attachWebGL({} as WebGL2RenderingContext);
    const otherOutline: GlyphOutline = {
      commands: [],
      bbox: { x1: 0, y1: 0, x2: 0, y2: 0 },
      fontSize: 50,
    };

    loop.setScene(effect, outline);
    loop.setScene(effect, otherOutline);

    expect(initGL).toHaveBeenCalledTimes(2);
  });

  it("attachCanvas2D 이후 attachWebGL을 호출해도 ctx2d 부착이 유지된다(둘 다 동시에 붙을 수 있음)", () => {
    const { scheduler, tick } = createFakeScheduler();
    const drawFrame = vi.fn();
    const effect = createCanvas2DEffect(drawFrame);
    const loop = new RenderLoop(scheduler);
    const ctx = {} as CanvasRenderingContext2D;
    loop.attachCanvas2D(ctx);
    loop.attachWebGL({} as WebGL2RenderingContext);
    loop.setScene(effect, outline);
    loop.start();
    tick(100);

    expect(drawFrame).toHaveBeenCalledTimes(1);
  });

  it("ctx가 붙어있지 않으면 조용히 아무 것도 하지 않는다(throw하지 않음)", () => {
    const { scheduler, tick } = createFakeScheduler();
    const drawFrame = vi.fn();
    const effect = createCanvas2DEffect(drawFrame);
    const loop = new RenderLoop(scheduler);
    // attachCanvas2D를 호출하지 않음
    loop.setScene(effect, outline);
    loop.start();

    expect(() => tick(100)).not.toThrow();
    expect(drawFrame).not.toHaveBeenCalled();
  });
});
