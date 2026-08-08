"use client";

import { useState } from "react";
import { useScrollReveal } from "@/lib/motion/scroll-reveal";
import { listStyles } from "../lib/registry";
import { applyStyle } from "../lib/transform";
import { GeneratorInput } from "./GeneratorInput";
import { StyleCard } from "./StyleCard";

const styles = listStyles();
const STAGGER_STEP_MS = 12;

export function UnicodeGenerator() {
  const [text, setText] = useState("");
  // 스크롤 리빌은 그리드 전체를 하나로 묶어 1회만 트리거한다 — 카드
  // 하나하나는 이미 타이핑할 때마다 StyleCard 자체의 크로스페이드가
  // 재생되므로(§StyleCard delayMs), 카드별로 또 리빌을 걸면 두
  // 트리거가 겹쳐 오히려 산만해진다.
  const { ref: gridRef, revealed } = useScrollReveal<HTMLDivElement>();

  return (
    <div className="flex flex-col gap-8">
      <GeneratorInput value={text} onChange={setText} />
      <div
        ref={gridRef}
        className={`grid grid-cols-1 gap-3 transition-all duration-500 ease-out sm:grid-cols-2 lg:grid-cols-3 ${
          revealed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {styles.map((style, index) => (
          <StyleCard
            key={style.id}
            label={style.label}
            output={applyStyle(text, style.id)}
            delayMs={index * STAGGER_STEP_MS}
          />
        ))}
      </div>
    </div>
  );
}
