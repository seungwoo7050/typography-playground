"use client";

import { useEffect, useRef } from "react";
import { RenderLoop } from "../core/render-loop";
import type { GlyphOutline } from "../core/glyph-outline";
import type { AnyEffectDefinition } from "../effects/types";

interface CanvasProps {
  effect: AnyEffectDefinition;
  outline: GlyphOutline | null;
  params: Record<string, unknown>;
  width: number;
  height: number;
}

/**
 * canvas2d 이펙트와 webgl 이펙트를 오가야 하는데, 캔버스 엘리먼트
 * 하나는 컨텍스트 타입을 한 번 정하면 바꿀 수 없다 — 그래서 두
 * 캔버스를 겹쳐두고 현재 이펙트의 renderTarget에 맞는 것만 보여준다.
 * RenderLoop은 하나만 만들어 두 컨텍스트를 동시에 들고 있는다.
 */
export function Canvas({ effect, outline, params, width, height }: CanvasProps) {
  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const webglRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<RenderLoop | null>(null);

  useEffect(() => {
    const loop = new RenderLoop();
    loopRef.current = loop;

    const ctx2d = canvas2dRef.current?.getContext("2d");
    if (ctx2d) loop.attachCanvas2D(ctx2d);

    const gl = webglRef.current?.getContext("webgl2");
    if (gl) loop.attachWebGL(gl);

    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (!outline) return;
    loopRef.current?.setScene(effect, outline, params);
  }, [effect, outline, params]);

  return (
    <div className="relative" style={{ width, height }}>
      <canvas
        ref={canvas2dRef}
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ display: effect.renderTarget === "canvas2d" ? "block" : "none" }}
      />
      <canvas
        ref={webglRef}
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ display: effect.renderTarget === "webgl" ? "block" : "none" }}
      />
    </div>
  );
}
