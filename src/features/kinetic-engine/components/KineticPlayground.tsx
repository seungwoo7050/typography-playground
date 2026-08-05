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
  const [effectId, setEffectId] = useState(effects[0]?.id ?? "");
  const [params, setParams] = useState<Record<string, unknown>>(
    effects[0]?.defaultParams ?? {},
  );

  useEffect(() => {
    let cancelled = false;
    // 폰트 전환 중에는 이전 폰트가 그대로 남아있다 — 캔버스가
    // 잠깐 비는 것보다 낫다(로딩 스피너는 2단계 폴리시 대상).
    loadKineticFont(fontId).then((loaded) => {
      if (!cancelled) setFont(loaded);
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
    <div className="flex flex-col gap-8">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="텍스트를 입력하세요"
        className="w-full border-b border-mist bg-transparent px-1 py-4 text-3xl text-ink outline-none placeholder:text-graphite focus:border-signal sm:text-4xl"
      />

      <Canvas
        effect={effect}
        outline={outline}
        params={params}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />

      <EffectGallery
        effects={effects}
        selectedId={effect.id}
        onSelect={handleSelectEffect}
      />

      <ParamPanel effect={effect} params={params} onChange={setParams} />

      <FontPicker fonts={KINETIC_FONTS} selectedId={fontId} onSelect={setFontId} />

      <ExportPanel font={font} text={text} effect={effect} params={params} />
    </div>
  );
}
