"use client";

import { useEffect, useMemo, useState } from "react";
import type { Font } from "opentype.js";
import { KINETIC_FONTS, loadKineticFont } from "../core/font-loader";
import { centerOutline, extractGlyphOutline } from "../core/glyph-outline";
import { getEffect, listEffects } from "../effects/registry";
import { Canvas } from "./Canvas";
import { EffectGallery } from "./EffectGallery";
import { ExportPanel } from "./ExportPanel";
import { FontPicker } from "./FontPicker";
import { ParamPanel } from "./ParamPanel";

const effects = listEffects();
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 280;
const FONT_SIZE = 120;
const DEFAULT_FONT_ID = "space-grotesk";

export function KineticPlayground() {
  const [text, setText] = useState("Wave");
  const [fontId, setFontId] = useState(DEFAULT_FONT_ID);
  const [font, setFont] = useState<Font | null>(null);
  // 지금 실제로 로드가 끝나 화면에 반영된 폰트의 id — fontId(선택
  // 직후 바로 바뀜)와 다르면 "아직 로딩 중"이라는 뜻이다. 별도
  // isLoading state를 effect 본문에서 동기적으로 set하는 대신 이렇게
  // 파생시키면 react-hooks/set-state-in-effect를 처음부터 피할 수
  // 있다(§scroll-reveal.ts에서 겪은 것과 같은 함정).
  const [loadedFontId, setLoadedFontId] = useState<string | null>(null);
  const [effectId, setEffectId] = useState(effects[0]?.id ?? "");
  const [params, setParams] = useState<Record<string, unknown>>(
    effects[0]?.defaultParams ?? {},
  );
  const isFontLoading = loadedFontId !== fontId;

  useEffect(() => {
    let cancelled = false;
    // 폰트 전환 중에는 이전 폰트가 그대로 남아있다 — 캔버스가
    // 잠깐 비는 것보다 낫다. 대신 isFontLoading으로 캔버스를 살짝
    // 낮춰서 "곧 바뀐다"는 신호는 준다(§Canvas 아래 opacity 처리).
    loadKineticFont(fontId).then((loaded) => {
      if (!cancelled) {
        setFont(loaded);
        setLoadedFontId(fontId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fontId]);

  const outline = useMemo(() => {
    if (!font || !text) return null;
    const raw = extractGlyphOutline(font, text, FONT_SIZE);
    // 원본 좌표는 텍스트 원점(첫 글자 베이스라인 좌측)이 (0,0)이라
    // 그대로 그리면 상승부가 캔버스 위쪽 바깥으로 잘려나간다.
    return centerOutline(raw, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, [font, text]);

  const effect = getEffect(effectId) ?? effects[0];

  function handleSelectEffect(id: string) {
    setEffectId(id);
    const next = getEffect(id);
    if (next) setParams(next.defaultParams);
  }

  if (!effect) return null;

  return (
    // 데스크톱(lg+)에서만 2단 — 왼쪽은 "스테이지"(입력+캔버스, 스크롤
    // 중에도 sticky로 계속 보임), 오른쪽은 "인스펙터"(이펙트/파라미터/
    // 폰트/export, 컨트롤이 많아 스크롤되는 쪽). 모바일/태블릿은
    // 기존과 동일하게 세로로 쌓인다 — 반응형/접근성 작업을 다시
    // 하지 않으려고 브레이크포인트 아래에서는 이전 구조(순서만
    // 유지한 flex-col)를 그대로 보존했다.
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-10">
      <div className="flex flex-col gap-8 lg:sticky lg:top-12">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="텍스트를 입력하세요"
          // GeneratorInput.tsx와 동일한 이유로 outline-style만 임의값으로
          // 지정한다 — outline-none이 이 엘리먼트의 --tw-outline-style을
          // 영구히 none으로 덮어써 focus-visible:outline-2가 참조하는
          // var(--tw-outline-style)도 항상 none으로 풀리기 때문.
          className="w-full border-b border-mist bg-transparent px-1 py-4 text-3xl text-ink outline-none placeholder:text-graphite focus:border-signal focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal sm:text-4xl"
        />

        <div className="relative">
          <div
            className={`transition-opacity duration-200 ${isFontLoading ? "opacity-40" : "opacity-100"}`}
          >
            <Canvas
              effect={effect}
              outline={outline}
              params={params}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            />
          </div>
          {/* 폰트 전환 중엔 이전 폰트로 그린 캔버스가 그대로 남아있는
              채 살짝 흐려지기만 한다(위 opacity-40) — 완전히 비우는
              대신, 진짜로 바뀌는 중이라는 신호만 얹는다. 나눔손글씨류
              같은 3MB대 폰트는 체감될 만큼 걸릴 수 있어 라벨도 같이
              띄운다. */}
          <span
            role="status"
            aria-live="polite"
            className={`absolute top-2 left-2 bg-paper/90 px-2 py-1 text-xs text-graphite transition-opacity duration-200 ${
              isFontLoading ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            폰트 불러오는 중…
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <EffectGallery
          effects={effects}
          selectedId={effect.id}
          onSelect={handleSelectEffect}
          font={font}
          text={text}
        />

        <ParamPanel effect={effect} params={params} onChange={setParams} />

        <FontPicker fonts={KINETIC_FONTS} selectedId={fontId} onSelect={setFontId} />

        <ExportPanel font={font} text={text} effect={effect} params={params} />
      </div>
    </div>
  );
}
