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

const TRANSITION_DURATION_MS = 350;

/**
 * canvas2d 이펙트와 webgl 이펙트를 오가야 하는데, 캔버스 엘리먼트
 * 하나는 컨텍스트 타입을 한 번 정하면 바꿀 수 없다 — 그래서 두
 * 캔버스를 겹쳐두고 현재 이펙트의 renderTarget에 맞는 것만 보여준다.
 * RenderLoop은 하나만 만들어 두 컨텍스트를 동시에 들고 있는다.
 *
 * 이펙트를 전환할 때는(파라미터 조정이나 텍스트 변경이 아니라 실제
 * 이펙트가 바뀔 때만) "의도적인 소재 변경"처럼 느껴지도록 아웃고잉
 * 이펙트의 마지막 프레임을 캡처해 오버레이 이미지로 얹고, 언더레이의
 * 새 이펙트가 그려지는 동안 오버레이를 350ms에 걸쳐 걷어낸다.
 */
export function Canvas({ effect, outline, params, width, height }: CanvasProps) {
  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const webglRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<RenderLoop | null>(null);
  const overlayRef = useRef<HTMLImageElement>(null);
  const prevEffectRef = useRef<AnyEffectDefinition | null>(null);

  useEffect(() => {
    const loop = new RenderLoop();
    loopRef.current = loop;

    const ctx2d = canvas2dRef.current?.getContext("2d");
    if (ctx2d) loop.attachCanvas2D(ctx2d);

    // preserveDrawingBuffer: true가 없으면 브라우저가 컴포지트 직후
    // 버퍼를 비울 수 있어, React 상태 변경 시점(비동기)에 뒤늦게
    // toDataURL()을 호출하면 빈 이미지가 캡처될 위험이 있다 — 전환
    // 크로스페이드가 마지막 프레임을 스냅샷해야 해서 반드시 켠다.
    const gl = webglRef.current?.getContext("webgl2", {
      preserveDrawingBuffer: true,
    });
    if (gl) loop.attachWebGL(gl);

    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (!outline) return;

    const prevEffect = prevEffectRef.current;
    const effectChanged = prevEffect !== null && prevEffect.id !== effect.id;

    if (effectChanged && overlayRef.current) {
      const prevCanvas =
        prevEffect.renderTarget === "canvas2d"
          ? canvas2dRef.current
          : webglRef.current;
      const snapshot = prevCanvas?.toDataURL("image/png");

      if (snapshot) {
        const img = overlayRef.current;
        img.src = snapshot;
        img.style.transition = "none";
        img.style.opacity = "1";
        // 강제 리플로우 — transition:none을 실제로 적용한 뒤에
        // opacity 전환을 걸어야 브라우저가 두 스타일 변경을 하나로
        // 묶어(transition 없이 바로 0으로) 점프시키지 않는다.
        void img.offsetWidth;
        img.style.transition = `opacity ${TRANSITION_DURATION_MS}ms ease-out`;
        img.style.opacity = "0";
      }
    }

    loopRef.current?.setScene(effect, outline, params);
    prevEffectRef.current = effect;
  }, [effect, outline, params]);

  return (
    // 캔버스 드로잉 버퍼 해상도(width/height 속성)는 이펙트 수학과
    // export 파이프라인이 그대로 참조하므로 고정 유지한다 — 여기서
    // 반응형으로 만드는 건 어디까지나 표시 크기(CSS)뿐이다.
    // aspect-ratio + max-width로 좁은 뷰포트에서는 컨테이너 폭에 맞춰
    // 줄어들고, 넓은 화면에서는 원본 해상도를 넘지 않는다.
    <div
      className="relative mx-auto w-full"
      style={{ maxWidth: width, aspectRatio: `${width} / ${height}` }}
    >
      {/* canvas는 대체 요소(replaced element)라 inset-0만으로는
          부모 크기에 맞춰 늘어나지 않는다 — width/height 속성(드로잉
          버퍼 해상도)이 auto인 CSS width/height보다 우선해 항상
          자신의 attribute 크기(800x280)로 렌더링된다. w-full/h-full로
          CSS 크기를 명시해야 표시 크기가 실제로 부모를 따라간다. */}
      <canvas
        ref={canvas2dRef}
        width={width}
        height={height}
        className="absolute inset-0 h-full w-full"
        style={{ display: effect.renderTarget === "canvas2d" ? "block" : "none" }}
      />
      <canvas
        ref={webglRef}
        width={width}
        height={height}
        className="absolute inset-0 h-full w-full"
        style={{ display: effect.renderTarget === "webgl" ? "block" : "none" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- 캔버스
          스냅샷(data URL)을 담는 임시 오버레이라 next/image 최적화
          대상이 아니다. */}
      <img
        ref={overlayRef}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
      />
    </div>
  );
}
