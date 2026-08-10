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
    // 키네틱 페이지의 스테이지+인스펙터(넓은 캔버스+좁은 컨트롤)와
    // 반대되는 비율: 여긴 입력 하나뿐이라 왼쪽 레일을 좁게(280px)
    // 잡고 카드 그리드가 넓게 펼쳐진다 — 같은 "왼쪽 고정+오른쪽
    // 스크롤" 메커니즘(타이핑하면서 계속 스크롤해 카드를 봐도 입력
    // 상자가 화면 밖으로 사라지지 않음)을 공유하되, 비중은 페이지마다
    // 다르게 둬서 두 페이지가 같은 틀을 재탕한 것처럼 보이지 않게
    // 했다.
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[280px_1fr] lg:items-start lg:gap-10">
      <div className="lg:sticky lg:top-12">
        <GeneratorInput value={text} onChange={setText} />
      </div>
      <div
        ref={gridRef}
        className={`grid grid-cols-1 gap-3 transition-all duration-500 ease-out sm:grid-cols-2 ${
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
