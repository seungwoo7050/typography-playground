"use client";

import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { KINETIC_FONTS } from "../core/font-loader";
import { centerOutline, extractGlyphOutline } from "../core/glyph-outline";
import { getEffect, listEffects } from "../effects/registry";
import { useKineticStore } from "../store/useKineticStore";
import { Canvas } from "./Canvas";
import { EffectGallery } from "./EffectGallery";
import { ExportPanel } from "./ExportPanel";
import { FontPicker } from "./FontPicker";
import { ParamPanel } from "./ParamPanel";

const effects = listEffects();
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 280;
const FONT_SIZE = 120;

export function KineticPlayground() {
  const {
    text,
    fontId,
    font,
    isFontLoading,
    isFontFailed,
    effectId,
    params,
    setText,
    setFontId,
    selectEffect,
    setParams,
    loadFont,
    retryFontLoad,
  } = useKineticStore();

  useEffect(() => {
    loadFont(fontId);
  }, [fontId, loadFont]);

  const fontLabel = KINETIC_FONTS.find((f) => f.id === fontId)?.label ?? fontId;

  const { outline, outlineFailed } = useMemo(() => {
    if (!font || !text) return { outline: null, outlineFailed: false };
    // opentype.js가 지원하지 않는 GSUB 룩업을 쓰는 폰트는 파싱은 되고
    // getPath에서 예외를 던진다(§font-loader.ts 카탈로그 주석). 렌더 중
    // 예외가 나면 페이지 전체가 무너지므로 여기서 잡아 문구로 바꾼다 —
    // 캔버스는 마지막으로 그린 장면을 그대로 둔다(Canvas는 outline이
    // null이면 씬을 바꾸지 않는다).
    try {
      const raw = extractGlyphOutline(font, text, FONT_SIZE);
      // 원본 좌표는 텍스트 원점(첫 글자 베이스라인 좌측)이 (0,0)이라
      // 그대로 그리면 상승부가 캔버스 위쪽 바깥으로 잘려나간다.
      return {
        outline: centerOutline(raw, CANVAS_WIDTH, CANVAS_HEIGHT),
        outlineFailed: false,
      };
    } catch {
      return { outline: null, outlineFailed: true };
    }
  }, [font, text]);

  // live region 안의 문구는 상태가 있을 때만 넣는다 — 문구를 늘 DOM에
  // 두고 opacity만 바꾸면 스크린 리더에는 로딩이 끝난 뒤에도 "불러오는
  // 중"이 남고, 내용이 바뀌지 않으니 aria-live가 알릴 변화도 없다.
  const fontStatusMessage = isFontFailed
    ? `${fontLabel} 폰트를 불러오지 못했어요`
    : isFontLoading
      ? "폰트 불러오는 중…"
      : outlineFailed
        ? "이 폰트로는 이 텍스트를 그릴 수 없어요"
        : "";

  const effect = getEffect(effectId) ?? effects[0];

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
            className={cn(
              "transition-opacity duration-200",
              isFontLoading ? "opacity-40" : "opacity-100"
            )}
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
          <div
            className={cn(
              "absolute top-2 left-2 flex items-center gap-2 bg-paper/90 px-2 py-1 text-xs text-graphite transition-opacity duration-200",
              fontStatusMessage ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            <span role="status" aria-live="polite">
              {fontStatusMessage}
            </span>
            {isFontFailed && (
              <button
                type="button"
                onClick={retryFontLoad}
                className="text-ink underline underline-offset-2 transition-colors hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
              >
                다시 시도
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <EffectGallery
          effects={effects}
          selectedId={effect.id}
          onSelect={selectEffect}
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
