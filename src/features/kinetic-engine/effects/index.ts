import { gradientFillEffect } from "./gradient-fill";
import type { AnyEffectDefinition } from "./types";

// 각 이펙트 파일이 이 배열에 자신의 정의를 추가한다.
export const allEffects: AnyEffectDefinition[] = [gradientFillEffect];
