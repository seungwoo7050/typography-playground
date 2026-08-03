"use client";

import { useState } from "react";
import { listStyles } from "../lib/registry";
import { applyStyle } from "../lib/transform";
import { GeneratorInput } from "./GeneratorInput";
import { StyleCard } from "./StyleCard";

const styles = listStyles();
const STAGGER_STEP_MS = 12;

export function UnicodeGenerator() {
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-8">
      <GeneratorInput value={text} onChange={setText} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
